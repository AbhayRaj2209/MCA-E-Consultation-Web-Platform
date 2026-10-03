const gtts = require('google-tts-api');
const fetch = require('node-fetch');
const { translations } = require('../data/documentSummaries');
const documentModel = require('../models/document.model');

const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const toDateString = (d) => (d ? String(d).slice(0, 10) : null);

const toPublicDocument = (doc) => ({
  id: doc.document_id,
  title: doc.document_name,
  type: doc.type_of_document,
  typeOfAct: doc.type_of_act,
  postedOn: toDateString(doc.posted_on),
  dueOn: toDateString(doc.comments_due_date),
  summary: doc.summary,
  hasAttachment: doc.has_attachment
});

// GET /api/documents  -> open (non-archived) consultations for the listing page
async function listDocuments(req, res, next) {
  try {
    const docs = await documentModel.listOpen();
    res.json({ success: true, data: docs.map(toPublicDocument) });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/:id  -> full text of one consultation
async function getDocument(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const doc = id && (await documentModel.findOpenById(id));
    if (!doc) return res.status(404).json({ success: false, message: 'Consultation not found' });
    res.json({ success: true, data: { ...toPublicDocument(doc), text: doc.document_data } });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/:id/attachment  -> file uploaded by the admin (stored as a base64 data URL)
async function getAttachment(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const doc = id && (await documentModel.getAttachment(id));
    const match = doc && doc.supported_document && /^data:([\w/+.-]+);base64,(.+)$/s.exec(doc.supported_document);
    if (!match) return res.status(404).json({ success: false, message: 'No attachment for this consultation' });

    const [, contentType, base64] = match;
    const extension = contentType === 'application/pdf' ? '.pdf' : '';
    const filename = `${doc.document_name.replace(/[^\w\- ]+/g, '').trim().slice(0, 80) || 'document'}${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(Buffer.from(base64, 'base64'));
  } catch (err) {
    next(err);
  }
}

// SSRF se bachne ke liye sirf Google TTS hosts allowed hain
const ALLOWED_AUDIO_HOSTS = ['translate.google.com', 'translate.googleusercontent.com'];
const TTS_LANGS = ['en', 'hi', 'es', 'ta'];

// GET /api/documents/:id/summary?lang=hi
// Section-wise summary + har section ka text-to-speech audio URL
async function getSummary(req, res, next) {
  try {
    const { id } = req.params;
    const lang = String(req.query.lang || 'en').toLowerCase();
    const ttsLang = TTS_LANGS.includes(lang) ? lang : 'en';
    const sections = translations[lang] || translations.en;

    const proxied = (url) => `/api/documents/${encodeURIComponent(id)}/audio-proxy?u=${encodeURIComponent(url)}`;

    const sectionsWithAudio = await Promise.all(sections.map(async (sec) => {
      const base = { id: sec.id, title: sec.title, text: sec.text };
      try {
        const rawUrl = gtts.getAudioUrl(sec.text, { lang: ttsLang, slow: false, host: 'https://translate.google.com' });
        return { ...base, audioUrl: proxied(rawUrl) };
      } catch (err) {
        // 200 characters se lamba text: multiple audio chunks
        try {
          const urls = await gtts.getAllAudioUrls(sec.text, { lang: ttsLang, host: 'https://translate.google.com' });
          if (!urls || !urls.length) return { ...base, audioUrl: null };
          return {
            ...base,
            audioUrl: proxied(urls[0].url || urls[0]),
            audioUrls: urls.map((u) => ({ ...u, proxied: proxied(u.url || u) }))
          };
        } catch (e) {
          return { ...base, audioUrl: null };
        }
      }
    }));

    res.json({ success: true, sections: sectionsWithAudio, confidence: 4.2 });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/:id/audio-proxy?u={encodedUrl}
// Google TTS audio ko proxy karta hai (browser CORS / referer issues avoid karne ke liye)
async function audioProxy(req, res, next) {
  try {
    const { u } = req.query;
    if (!u || typeof u !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing url (u) parameter' });
    }

    let parsed;
    try {
      parsed = new URL(u);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid URL' });
    }
    if (parsed.protocol !== 'https:' || !ALLOWED_AUDIO_HOSTS.includes(parsed.hostname)) {
      return res.status(400).json({ success: false, message: 'URL host not allowed' });
    }

    const upstream = await fetch(parsed.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://translate.google.com/'
      },
      timeout: 15000
    });
    if (!upstream.ok) {
      return res.status(502).json({ success: false, message: 'Audio service unavailable' });
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    upstream.body.pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { listDocuments, getDocument, getAttachment, getSummary, audioProxy };
