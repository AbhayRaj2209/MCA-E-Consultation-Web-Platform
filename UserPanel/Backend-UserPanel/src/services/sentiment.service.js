const fetch = require('node-fetch');

const NEUTRAL_RESULT = {
  sentiment: 'neutral',
  summary: null,
  confidence: 0.0,
  strongOpinion: false,
  keywords: []
};

function unavailableError(cause) {
  const error = new Error('Sentiment analysis service is unavailable.');
  error.status = 503;
  error.expose = true;
  error.cause = cause;
  return error;
}

function getFastApiUrl() {
  const configuredUrl = process.env.FASTAPI_URL?.trim();
  if (!configuredUrl && process.env.NODE_ENV === 'production') {
    throw unavailableError(new Error('FASTAPI_URL is not configured.'));
  }
  return configuredUrl || 'http://127.0.0.1:8001';
}

// FastAPI ML model se sentiment analysis; service down ho to neutral fallback
async function analyzeSentiment(text) {
  let fastApiUrl;
  try {
    fastApiUrl = getFastApiUrl();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
    return NEUTRAL_RESULT;
  }

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
    const sentiment = String(data.sentiment || 'neutral').trim().toLowerCase();
    if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
      throw unavailableError(new Error(`Invalid sentiment returned by FastAPI: ${data.sentiment}`));
    }

    const result = {
      sentiment,
      summary: data.processed_text || null,
      confidence: Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : 0.0,
      strongOpinion: data.strong_opinion || false,
      keywords: data.keywords || []
    };

    console.log(`Sentiment analysis: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
    return result;
  } catch (e) {
    console.error('FastAPI error:', e.message || e);
    if (process.env.NODE_ENV === 'production') throw unavailableError(e);
    return NEUTRAL_RESULT;
  }
}

module.exports = { analyzeSentiment };
