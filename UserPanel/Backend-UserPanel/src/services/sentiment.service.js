const fetch = require('node-fetch');

const NEUTRAL_RESULT = {
  sentiment: 'neutral',
  summary: null,
  confidence: 0.0,
  strongOpinion: false,
  keywords: []
};

// FastAPI ML model se sentiment analysis; service down ho to neutral fallback
async function analyzeSentiment(text) {
  const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8001';

  try {
    const resp = await fetch(`${fastApiUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      timeout: 30000
    });

    if (!resp.ok) {
      console.warn('FastAPI service error:', resp.status);
      return NEUTRAL_RESULT;
    }

    const data = await resp.json();
    const result = {
      sentiment: data.sentiment || 'neutral',
      summary: data.processed_text || null,
      confidence: data.confidence || 0.0,
      strongOpinion: data.strong_opinion || false,
      keywords: data.keywords || []
    };

    console.log(`Sentiment analysis: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
    return result;
  } catch (e) {
    console.error('FastAPI error:', e.message || e);
    return NEUTRAL_RESULT;
  }
}

module.exports = { analyzeSentiment };
