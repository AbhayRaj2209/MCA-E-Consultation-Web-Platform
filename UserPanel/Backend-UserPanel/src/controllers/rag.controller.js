const { answerQuestion } = require('../services/rag.service');

async function chat(req, res, next) {
  try {
    const result = await answerQuestion(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { chat };
