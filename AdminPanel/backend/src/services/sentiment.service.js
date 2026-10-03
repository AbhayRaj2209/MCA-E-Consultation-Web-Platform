const VALID_SENTIMENTS = ['positive', 'negative', 'neutral'];

// FastAPI ML model se sentiment; service down ho to neutral fallback
async function analyzeSentiment(text) {
  const result = { sentiment: 'neutral', confidence: 0.0, strongOpinion: false, keywords: [], summary: null };
  const fastApiUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8001';

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
    result.sentiment = data.sentiment || 'neutral';
    result.confidence = data.confidence || 0.0;
    result.strongOpinion = data.strong_opinion || false;
    result.keywords = data.keywords || [];
    result.summary = data.processed_text || null;

    if (!VALID_SENTIMENTS.includes(String(result.sentiment).toLowerCase())) {
      console.warn(`[SECURITY] Invalid sentiment received from model: ${result.sentiment}. Defaulting to neutral.`);
      result.sentiment = 'neutral';
    }

    console.log(`Sentiment analysis: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
  } catch (e) {
    console.error('Failed to fetch sentiment:', e.message);
  }

  return result;
}

module.exports = { analyzeSentiment };
