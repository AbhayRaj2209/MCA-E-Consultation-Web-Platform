import React from "react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askRagAssistant } from "@/services/api";

const MAX_QUESTION_LENGTH = 1000;

const SaaranshAssistant = () => {
  const [messages, setMessages] = React.useState([]);
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const submitQuestion = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
    setQuestion("");
    setError("");
    setLoading(true);

    const result = await askRagAssistant(trimmedQuestion, history);
    if (result.ok) {
      setMessages((current) => [...current, {
        role: "assistant",
        content: result.data.data.answer,
        sources: result.data.data.sources || [],
      }]);
    } else {
      setError(result.data.message || "The assistant could not answer right now.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-gov-orange">PROJECT SAARANSH</p>
          <h1 className="text-3xl font-bold text-gov-blue">Ask the project assistant</h1>
          <p className="mt-2 text-muted-foreground">
            Ask about the architecture, ML pipeline, database, security, or frontend. Answers are grounded in the project PDF.
          </p>
        </div>

        <Card className="min-h-[28rem]">
          <CardContent className="flex min-h-[28rem] flex-col gap-4 p-4 sm:p-6">
            <div className="flex-1 space-y-4 overflow-y-auto rounded-md bg-slate-50 p-4">
              {messages.length === 0 && (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
                  <Bot className="mb-3 h-10 w-10 text-gov-blue" />
                  <p className="font-medium text-foreground">What would you like to know?</p>
                  <p className="mt-1 text-sm">Try “How does sentiment analysis work?”</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "assistant" && <Bot className="mt-1 h-5 w-5 shrink-0 text-gov-blue" />}
                  <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    message.role === "user" ? "bg-gov-blue text-white" : "bg-white border"
                  }`}>
                    {message.content}
                    {message.sources?.length > 0 && (
                      <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                        Source: Project Saaransh Interview Q&A, page{message.sources.length > 1 ? "s" : ""}{" "}
                        {message.sources.map((source) => source.page).join(", ")}
                      </p>
                    )}
                  </div>
                  {message.role === "user" && <User className="mt-1 h-5 w-5 shrink-0 text-gov-blue" />}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Bot className="h-5 w-5 text-gov-blue" />
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching the project PDF...
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <form onSubmit={submitQuestion} className="flex flex-col gap-2 sm:flex-row">
              <Textarea
                value={question}
                maxLength={MAX_QUESTION_LENGTH}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question about Project Saaransh..."
                rows={2}
                className="resize-none"
                aria-label="Question"
              />
              <Button type="submit" disabled={loading || !question.trim()} className="sm:self-end">
                <Send className="h-4 w-4" /> Ask
              </Button>
            </form>
            <p className="text-right text-xs text-muted-foreground">{question.length}/{MAX_QUESTION_LENGTH}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SaaranshAssistant;
