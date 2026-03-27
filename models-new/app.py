from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
import torch.nn.functional as F
import emoji
import re
from fastapi.middleware.cors import CORSMiddleware

from typing import List
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# ----------- INIT APP -----------
app = FastAPI(title="Policy Sentiment + Summarization + Evaluation API")

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

# ----------- HELPER PREDICT -----------
def predict_label(text):
    processed = preprocess_text(text)

    inputs = tokenizer(processed, return_tensors="pt", truncation=True, padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=1)
        pred = torch.argmax(probs, dim=1).item()

    return label_map[model.config.id2label[pred]]

# ----------- REQUEST MODELS -----------
class TextRequest(BaseModel):
    text: str

class SummaryRequest(BaseModel):
    comments: list[str]

class BatchRequest(BaseModel):
    data: List[dict]

# ----------- ROOT -----------
@app.get("/")
def home():
    return {"message": "API running 🚀"}

# ----------- SENTIMENT -----------
@app.post("/predict")
def predict(request: TextRequest):
    try:
        sentiment = predict_label(request.text)

        return {
            "text": request.text,
            "sentiment": sentiment
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------- SUMMARIZATION -----------
@app.post("/summarize-by-sentiment")
def summarize_by_sentiment(request: SummaryRequest):
    try:
        comments = request.comments

        positives, negatives, neutrals = [], [], []

        for text in comments:
            label = predict_label(text)

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
            return summarizer(text, max_length=100, min_length=25, do_sample=False)[0]["summary_text"]

        return {
            "overall": generate_summary(comments),
            "positive": generate_summary(positives),
            "negative": generate_summary(negatives),
            "neutral": generate_summary(neutrals)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------- EVALUATION -----------
@app.post("/evaluate")
def evaluate(req: BatchRequest):
    y_true = []
    y_pred = []

    for item in req.data:
        y_true.append(item["label"])
        y_pred.append(predict_label(item["text"]))

    cm = confusion_matrix(y_true, y_pred, labels=["negative", "neutral", "positive"])

    return {
        "confusion_matrix": cm.tolist(),
        "labels": ["negative", "neutral", "positive"]
    }

# ----------- HEATMAP -----------
@app.post("/heatmap")
def heatmap(req: BatchRequest):
    y_true = []
    y_pred = []

    for item in req.data:
        y_true.append(item["label"])
        y_pred.append(predict_label(item["text"]))

    cm = confusion_matrix(y_true, y_pred, labels=["negative", "neutral", "positive"])

    plt.figure()
    sns.heatmap(cm, annot=True, fmt="d",
                xticklabels=["negative", "neutral", "positive"],
                yticklabels=["negative", "neutral", "positive"])

    path = "confusion_matrix.png"
    plt.savefig(path)
    plt.close()

    return {"message": "Heatmap saved", "file": path}