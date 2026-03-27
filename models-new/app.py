from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
import torch.nn.functional as F
import emoji
import re
from fastapi.middleware.cors import CORSMiddleware

# ----------- INIT APP -----------
app = FastAPI(title="Policy Sentiment + Summarization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- DEVICE -----------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ----------- SENTIMENT MODEL -----------
MODEL_PATH = "cardiffnlp/twitter-roberta-base-sentiment"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

model.to(device)
model.eval()

# ----------- SUMMARIZER -----------
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    device=0 if torch.cuda.is_available() else -1
)

# ----------- LABEL MAP -----------
label_map = {
    "LABEL_0": "negative",
    "LABEL_1": "neutral",
    "LABEL_2": "positive"
}

# ----------- EMOJI MAP -----------
EMOJI_MAP = {
    "😊": "happy", "😍": "positive",
    "😂": "funny", "😢": "sad",
    "😭": "very sad", "😡": "angry",
    "👍": "support", "👎": "oppose",
    "🔥": "important", "💔": "harm"
}

# ----------- SLANG MAP -----------
SLANG_MAP = {
    "u": "you", "ur": "your", "r": "are",
    "pls": "please", "plz": "please",
    "wtf": "what the hell", "omg": "oh my god"
}

# ----------- HINGLISH MAP -----------
HINGLISH_MAP = {
    "aacha": "good", "accha": "good", "acha": "good", "achha": "good",
    "bura": "bad", "buri": "bad",
    "sahi": "correct", "galat": "wrong",
    "theek": "okay", "thik": "okay",
    "liya": "taken", "diya": "given", "kiya": "done",
    "h": "is", "hai": "is", "tha": "was", "thi": "was",
    "ne": "", "ko": "", "se": "", "ka": "", "ke": "", "ki": "",
    "virodh": "oppose", "samarthan": "support",
    "kanoon": "law", "niyam": "rule",
    "badiya": "good", "bekar": "bad", "bakwas": "bad",
    "abhi": "now", "jaldi": "fast",
    "sarkar": "government", "govt": "government", "mca": "mca",
    "kyuki": "because", "kyonki": "because",
    "agar": "if", "lekin": "but", "par": "but", "toh": "then",
    "nahi": "not", "nahin": "not"
}

# ----------- PHRASES -----------
PHRASES = {
    "acha liya": "good decision",
    "sahi hai": "correct",
    "galat hai": "wrong",
    "support karta": "support",
    "virodh karta": "oppose",
    "hona chahiye": "should happen"
}

# ----------- STRONG WORDS -----------
STRONG_OPINION_WORDS = {
    "corrupt", "useless", "harmful", "dangerous",
    "unfair", "illegal", "biased", "wrong",
    "bad", "worst", "poor", "inefficient",
    "fail", "failure", "problem", "issue",
    "concern", "risk", "controversial"
}

# ----------- PREPROCESS -----------
def preprocess_text(text):
    text = text.lower()

    for k, v in PHRASES.items():
        text = text.replace(k, v)

    text = emoji.replace_emoji(
        text,
        replace=lambda x, _: " " + EMOJI_MAP.get(x, "") + " "
    )

    words = text.split()
    processed = []

    for w in words:
        if w in SLANG_MAP:
            processed.append(SLANG_MAP[w])
        elif w in HINGLISH_MAP:
            mapped = HINGLISH_MAP[w]
            if mapped != "":
                processed.append(mapped)
        else:
            processed.append(w)

    text = " ".join(processed)
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text

# ----------- STRONG OPINION -----------
def detect_strong_opinion(text):
    return [w for w in text.split() if w in STRONG_OPINION_WORDS]

# ----------- REQUEST MODELS -----------
class TextRequest(BaseModel):
    text: str

class SummaryRequest(BaseModel):
    comments: list[str]

# ----------- ROOT -----------
@app.get("/")
def home():
    return {"message": "API running 🚀"}

# ----------- SENTIMENT API -----------
@app.post("/predict")
def predict(request: TextRequest):
    try:
        original_text = request.text
        processed_text = preprocess_text(original_text)

        inputs = tokenizer(
            processed_text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        )

        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            probs = F.softmax(outputs.logits, dim=1)
            pred = torch.argmax(probs, dim=1).item()

        sentiment = label_map[model.config.id2label[pred]]
        strong_words = detect_strong_opinion(processed_text)

        return {
            "original_text": original_text,
            "processed_text": processed_text,
            "sentiment": sentiment,
            "confidence": float(probs[0][pred]),
            "strong_opinion": len(strong_words) > 0,
            "keywords": strong_words
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------- SUMMARIZATION API -----------
@app.post("/summarize-by-sentiment")
def summarize_by_sentiment(request: SummaryRequest):
    try:
        comments = request.comments

        if not comments:
            return {
                "overall": "No comments available",
                "positive": "No data",
                "negative": "No data"
            }

        positives, negatives, neutrals = [], [], []

        for text in comments:
            processed = preprocess_text(text)

            inputs = tokenizer(processed, return_tensors="pt", truncation=True)
            inputs = {k: v.to(device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = model(**inputs)
                probs = F.softmax(outputs.logits, dim=1)
                pred = torch.argmax(probs, dim=1).item()

            label = label_map[model.config.id2label[pred]]

            if label == "positive":
                positives.append(text)
            elif label == "negative":
                negatives.append(text)
            else:
                neutrals.append(text)

        def generate_summary(texts):
            if not texts:
                return "No data"
            text = " ".join(texts)[:2000]

            result = summarizer(
                text,
                max_length=100,
                min_length=25,
                do_sample=False
            )
            return result[0]["summary_text"]

        return {
            "overall": generate_summary(comments),
            "positive": generate_summary(positives),
            "negative": generate_summary(negatives),
            "neutral": generate_summary(neutral)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))