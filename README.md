# 🛡️ SMS Spam Classifier Dashboard

A production-ready **FastAPI** dashboard for classifying SMS messages as **spam** or **ham** using a pre-trained **Multinomial Naive Bayes** model with **97.2% accuracy**.

---

## ✨ Features

- **Single Message Classifier** — Instantly classify any SMS with confidence score and processing time
- **Batch Classifier** — Classify up to 100 messages at once (paste or upload `.txt` file)
- **Live Session Statistics** — Real-time spam/ham counters updated after every classification
- **Classification History** — Last 20 classified messages with labels and confidence
- **Model Info Dashboard** — Full pipeline details, performance metrics, and API reference
- **Interactive API Docs** — Auto-generated Swagger UI at `/docs`
- **Premium Dark-Mode UI** — Glassmorphism, animated gradients, and micro-interactions

---

## 📁 Project Structure

```
Sms Spam Classification(Naive Bayes)/
├── app/
│   ├── __init__.py
│   ├── main.py              ← FastAPI entry point
│   ├── models.py            ← Pydantic request/response schemas
│   ├── predictor.py         ← Model loading & prediction logic
│   └── routers/
│       ├── __init__.py
│       └── classify.py      ← /classify & /classify/batch endpoints
├── models/
│   ├── spam_classifier_model.pkl   ← Trained MultinomialNB model
│   └── tfidf_vectorizer.pkl        ← Fitted TF-IDF vectorizer
├── static/
│   ├── css/
│   │   └── style.css        ← Premium dark-mode dashboard styles
│   ├── js/
│   │   └── app.js           ← Frontend logic (fetch API, history, toasts)
│   └── index.html           ← Single-page dashboard
├── spam-message-classification-naive-bayes.ipynb
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone / Open the project

```bash
cd "Sms Spam Classification(Naive Bayes)"
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the server

```bash
uvicorn app.main:app --reload
```

### 5. Open the dashboard

Navigate to **[http://localhost:8000](http://localhost:8000)** in your browser.

> Interactive API docs are available at **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/`      | Serves the dashboard HTML |
| `POST` | `/classify` | Classify a single SMS message |
| `POST` | `/classify/batch` | Classify up to 100 messages |
| `GET`  | `/health` | Model health check |
| `GET`  | `/stats` | Session classification statistics |
| `GET`  | `/docs` | Swagger interactive API docs |
| `GET`  | `/redoc` | ReDoc API documentation |

### Example: Classify a single message

```bash
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{"message": "Congratulations! You have won a FREE prize. Call now!"}'
```

**Response:**
```json
{
  "message": "Congratulations! You have won a FREE prize. Call now!",
  "label": "spam",
  "confidence": 0.9987,
  "processing_time_ms": 2.45,
  "timestamp": "2026-06-26T13:30:00.000Z"
}
```

### Example: Batch classification

```bash
curl -X POST http://localhost:8000/classify/batch \
  -H "Content-Type: application/json" \
  -d '{"messages": ["Win a FREE iPhone!", "Hey, are you coming tonight?"]}'
```

---

## 🤖 Model Details

| Property | Value |
|----------|-------|
| Algorithm | Multinomial Naive Bayes |
| Vectorizer | TF-IDF (`max_features=5000`, `stop_words='english'`) |
| Dataset | UCI SMS Spam Collection (5,572 messages) |
| Train/Test Split | 80% / 20% (stratified) |
| Overall Accuracy | **97.22%** |
| Spam Precision | 99% |
| Spam Recall | 80% |
| Ham Precision | 97% |
| Ham Recall | 100% |

### Classification Pipeline

```
Raw SMS → TF-IDF Vectorizer → 5,000 Features → MultinomialNB → Spam / Ham
```

---

## 📓 Notebook

The full training workflow is documented in [`spam-message-classification-naive-bayes.ipynb`](./spam-message-classification-naive-bayes.ipynb), covering:

1. Dataset loading and exploration
2. Label mapping (ham=0, spam=1)
3. Train/test split (80/20, stratified)
4. TF-IDF feature extraction
5. Model training and evaluation
6. Confusion matrix visualization
7. Model serialization with `joblib`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | [FastAPI](https://fastapi.tiangolo.com/) |
| ASGI Server | [Uvicorn](https://www.uvicorn.org/) |
| ML Model | [scikit-learn](https://scikit-learn.org/) MultinomialNB |
| Serialization | [joblib](https://joblib.readthedocs.io/) |
| Data Validation | [Pydantic v2](https://docs.pydantic.dev/) |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Typography | [Inter](https://fonts.google.com/specimen/Inter) + JetBrains Mono |

---

## 📝 License

This project is for educational purposes. The UCI SMS Spam Collection dataset is publicly available at [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/228/sms+spam+collection).
