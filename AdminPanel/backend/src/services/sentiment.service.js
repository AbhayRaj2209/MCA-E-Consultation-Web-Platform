const VALID_SENTIMENTS = ['positive', 'negative', 'neutral'];

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

// FastAPI ML model se sentiment; service down ho to neutral fallback
async function analyzeSentiment(text) {
  const result = { sentiment: 'neutral', confidence: 0.0, strongOpinion: false, keywords: [], summary: null };
  let fastApiUrl;
  try {
    fastApiUrl = getFastApiUrl();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error;
    return result;
  }

  try {
    const response = await fetch(`${fastApiUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.warn('FastAPI service returned non-OK status:', response.status);
      return result;
    }

    const data = await response.json();
    result.sentiment = String(data.sentiment || 'neutral').trim().toLowerCase();
    result.confidence = Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : 0.0;
    result.strongOpinion = data.strong_opinion || false;
    result.keywords = data.keywords || [];
    result.summary = data.processed_text || null;

    if (!VALID_SENTIMENTS.includes(String(result.sentiment).toLowerCase())) {
      throw unavailableError(new Error(`Invalid sentiment returned by FastAPI: ${data.sentiment}`));
    }

    console.log(`Sentiment analysis: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
  } catch (e) {
    console.error('Failed to fetch sentiment:', e.message);
    if (process.env.NODE_ENV === 'production') throw unavailableError(e);
  }

  return result;
}

module.exports = { analyzeSentiment };
