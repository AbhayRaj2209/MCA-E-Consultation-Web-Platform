# 🇮🇳 SAARANSH – E-Consultation Sentiment Analysis Platform
AI-Powered Citizen Feedback Intelligence for Government Policies.

> Developed for **India Innovates 2026** – Bharat Mandapam, New Delhi | 28 March 2026

---

# Overview

SAARANSH is an AI-powered platform that automatically analyzes large volumes of citizen feedback submitted during government policy consultations. It transforms unstructured, multilingual public comments into structured, actionable insights for policymakers — reducing manual review time by **80%+** while ensuring **100% feedback coverage**.

---

# Problem Statement

Government ministries receive thousands of public comments on draft policies through e-consultation portals. Manual analysis is:
- Time-consuming (15–20 minutes per comment)
- Unable to scale across multilingual submissions
- Prone to missing key trends and concerns

---

#  Solution

A multi-stage NLP pipeline that automatically processes citizen comments and generates insights:

 ✔ Sentiment analysis (Positive / Neutral / Negative)
 ✔ Topic clustering & keyword extraction
 ✔ Multilingual processing (English, Hindi, regional languages)
 ✔ Policy feedback summarization
 ✔ Interactive admin dashboard with visual reports

---

# System Architecture

User Submissions(UserPanel) → Input Layer Comment about bill (Text / PDF / OCR)
    → Preprocessing (Cleaning, Tokenization, Language Detection)
    → AI Model Ensemble (BERT / Legal-BERT / IndicBERT / LLMs)
    → Expert Voting System
    → Insight Generation (Sentiment, Keywords, Topics, Summaries)
    → Admin Dashboard


---

# AI Models

Ensemble approach combining:
- BERT / DistilBERT – baseline embeddings & sentiment
- Legal-BERT** – policy and legal text understanding
- IndicBERT** – multilingual Indian language processing


---

## ⚙️ Tech Stack

| Layer | Technology |
| Frontend | React |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon) |
| AI / ML | Python, HuggingFace Transformers, Ensemble NLP |
| OCR | Tesseract / similar |
| Infrastructure | Kubernetes, Microservices |
Deployed frontend on Vercel and Backend in Render because they are providing free services we will shift towards aws services soon if our project pass for final round.

---

## Status

**Prototype Level: 3 / 5

**Completed:
- Text feedback processing pipeline
- Sentiment analysis module
- Summarization engine

**Upcoming:
- OCR support for PDFs and scanned images
- Advanced analytics dashboard
- Region-wise sentiment insights
- Heat Map
- Real-time consultation monitoring

# Team (Byte Builders)


  Abhay Raj 
 Ishaan Saxena 
 Priyesh Raj 
 Devisha Bhargava  
  Shivam Shaurya 

 References

- BERT – Devlin et al. (2019)
- Legal-BERT – Chalkidis et al. (2020)
- IndicNLPSuite – Kakwani et al. (2020)
- Digital India Public Consultation Framework

- Contact: abhayraj3051@gmail.com  for any queries fell free to contact and if you can do open source contribution in our project you are most welcome.
