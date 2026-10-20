const fs = require('fs');
const path = require('path');

const MAX_QUESTION_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 6;

let ragChainPromise;

function getPdfPath() {
  return process.env.RAG_PDF_PATH
    ? path.resolve(process.env.RAG_PDF_PATH)
    : path.resolve(__dirname, '..', '..', 'data', 'Saaransh_Interview_QA.pdf');
}

function validateQuestion(question) {
  if (typeof question !== 'string' || !question.trim()) {
    const error = new Error('A question is required.');
    error.status = 400;
    error.expose = true;
    throw error;
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    const error = new Error(`Question must be ${MAX_QUESTION_LENGTH} characters or fewer.`);
    error.status = 400;
    error.expose = true;
    throw error;
  }
}

function normaliseHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((message) => message && ['user', 'assistant'].includes(message.role)
      && typeof message.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content.slice(0, 2000)}`)
    .join('\n');
}

async function createRagChain() {
  const pdfPath = getPdfPath();
  if (!fs.existsSync(pdfPath)) {
    const error = new Error(`RAG PDF not found at ${pdfPath}. Set RAG_PDF_PATH to a valid PDF.`);
    error.status = 500;
    throw error;
  }
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is not configured for the RAG chatbot.');
    error.status = 503;
    throw error;
  }

  const [{ PDFLoader }, { RecursiveCharacterTextSplitter }, { MemoryVectorStore },
    { ChatOpenAI, OpenAIEmbeddings }, { ChatPromptTemplate }] = await Promise.all([
    import('@langchain/community/document_loaders/fs/pdf'),
    import('@langchain/textsplitters'),
    import('langchain/vectorstores/memory'),
    import('@langchain/openai'),
    import('@langchain/core/prompts')
  ]);

  const loader = new PDFLoader(pdfPath);
  const pages = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1200, chunkOverlap: 200 });
  const chunks = await splitter.splitDocuments(pages);
  const vectorStore = await MemoryVectorStore.fromDocuments(chunks, new OpenAIEmbeddings());
  const retriever = vectorStore.asRetriever({ k: 4 });
  const model = new ChatOpenAI({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0 });
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are Saaransh Assistant, a factual guide to the Project Saaransh documentation.
Answer only from the supplied context. If the answer is not in the context, say you could not find it in the project PDF.
Do not invent endpoints, metrics, technologies, or personal contributions. Keep answers concise and explain technical terms when useful.

Context:
{context}

Conversation history:
{history}`],
    ['human', '{question}']
  ]);

  return async ({ question, history }) => {
    const documents = await retriever.invoke(question);
    const context = documents.map((document) => document.pageContent).join('\n\n');
    const messages = await prompt.formatMessages({
      context,
      history: normaliseHistory(history) || 'No previous messages.',
      question
    });
    const response = await model.invoke(messages);
    return {
      answer: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      sources: documents.map((document) => ({
        page: (document.metadata && document.metadata.loc && document.metadata.loc.pageNumber)
          || (document.metadata && document.metadata.page)
          || null
      })).filter((source, index, sources) => source.page && sources.findIndex((item) => item.page === source.page) === index)
    };
  };
}

async function answerQuestion({ question, history }) {
  validateQuestion(question);
  if (!ragChainPromise) ragChainPromise = createRagChain().catch((error) => {
    ragChainPromise = null;
    throw error;
  });
  return ragChainPromise.then((chain) => chain({ question: question.trim(), history }));
}

module.exports = { answerQuestion, MAX_QUESTION_LENGTH };
