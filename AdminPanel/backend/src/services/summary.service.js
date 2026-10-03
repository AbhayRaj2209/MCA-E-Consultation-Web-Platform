// Group summarisation model (comments ki list -> ek summary)
const GROUP_SUMMARY_URL = process.env.GROUP_SUMMARY_URL || 'http://192.168.1.53:8364/api/summarize_group';

async function getGroupSummary(comments) {
  if (!comments.length) return null;

  try {
    const response = await fetch(GROUP_SUMMARY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments }),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      console.warn('Group Summary API failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.final_summary || data.summary || (data.summaries ? data.summaries[0] : null);
  } catch (e) {
    console.error('Group Summary Error:', e.message);
    return null;
  }
}

module.exports = { getGroupSummary };
