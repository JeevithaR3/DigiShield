# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from transformers import pipeline
# from datetime import datetime
# from pymongo import MongoClient

# app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "*"}})  # Fix CORS issues

# # Connect to MongoDB (adjust DB URI as needed)
# client = MongoClient("mongodb://localhost:27017/")
# db = client["ai_defender"]
# collection = db["toxic_messages"]

# # Load Models
# bert_model = pipeline("text-classification", model="unitary/toxic-bert", top_k=None)
# roberta_model = pipeline("text-classification", model="SkolkovoInstitute/roberta_toxicity_classifier", top_k=None)

# # Labels to check from RoBERTa model
# roberta_labels = [
#     "toxic", "severe_toxicity", "obscene",
#     "identity_attack", "insult", "threat", "sexual_explicit"
# ]

# # Analyze single message
# def analyze_text(text):
#     # BERT prediction
#     bert_output = bert_model(text)[0]
#     bert_score = max(bert_output, key=lambda x: x['score'])

#     # RoBERTa prediction
#     roberta_output = roberta_model(text)[0]
#     roberta_result = {label['label']: label['score'] for label in roberta_output}

#     # Decide if toxic (multi-check)
#     toxic = False
#     if bert_score['label'].lower() == "toxic" and bert_score['score'] > 0.75:
#         toxic = True
#     elif any(roberta_result.get(label, 0) >= 0.5 for label in roberta_labels):
#         toxic = True

#     return {
#         "text": text,
#         "label": "toxic" if toxic else "non-toxic",
#         "risk_score": int(bert_score['score'] * 100),
#         "multi_labels": roberta_result
#     }

# @app.route("/")
# def home():
#     return "AI Defender is running."

# @app.route("/analyze_batch", methods=["POST"])
# def analyze_batch():
#     try:
#         data = request.get_json()
#         texts = data.get("texts", [])
#         url = data.get("url", "unknown")

#         if not isinstance(texts, list) or not texts:
#             return jsonify({"error": "Invalid or missing 'texts' list"}), 400

#         results = []
#         for text in texts:
#             result = analyze_text(text)
#             results.append(result)

#             if result["label"] == "toxic":
#                 collection.insert_one({
#                     "message": text,
#                     "label": result["label"],
#                     "risk_score": result["risk_score"],
#                     "multi_labels": result["multi_labels"],
#                     "website": url,
#                     "timestamp": datetime.utcnow()
#                 })

#         return jsonify(results)

#     except Exception as e:
#         print(f"Error in /analyze_batch: {e}")
#         return jsonify({"error": str(e)}), 500

# if __name__ == "__main__":
#     app.run(debug=True)

# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from transformers import pipeline
# from datetime import datetime
# from pymongo import MongoClient

# app = Flask(__name__)

# # --- CORS ----------------------------------------------------
# CORS(app, resources={r"/*": {"origins": "*"}})   # allow extension / file:// pages

# # --- MongoDB -------------------------------------------------
# client = MongoClient("mongodb://localhost:27017/")
# db = client["ai_defender"]
# collection = db["toxic_messages"]

# # --- Models --------------------------------------------------
# bert_model    = pipeline("text-classification",
#                          model="unitary/toxic-bert",
#                          top_k=None)
# roberta_model = pipeline("text-classification",
#                          model="SkolkovoInstitute/roberta_toxicity_classifier",
#                          top_k=None)

# ROBERTA_LABELS = [
#     "toxic", "severe_toxicity", "obscene",
#     "identity_attack", "insult", "threat", "sexual_explicit"
# ]

# # --- Helper --------------------------------------------------
# def analyze_text(text: str) -> dict:
#     """Return toxicity analysis for a single sentence."""
#     # BERT (binary)
#     bert_output = bert_model(text)[0]           # list of dicts
#     bert_top    = max(bert_output, key=lambda x: x["score"])

#     # RoBERTa (multi-label)
#     rob_output  = roberta_model(text)[0]        # list of dicts
#     rob_scores  = {d["label"]: d["score"] for d in rob_output}

#     # ── Toxicity logic ───────────────────────────────────────
#     toxic = False

#     # 1) BERT: label == toxic & score > 0.65
#     if bert_top["label"].lower() == "toxic" and bert_top["score"] > 0.65:
#         toxic = True
#     # 2) Any RoBERTa key above 0.50
#     elif any(rob_scores.get(lbl, 0) >= 0.50 for lbl in ROBERTA_LABELS):
#         toxic = True
#     # 3) Fallback phrase match
#     threat_phrases = [
#         "i'm going to hurt you", "i will hurt you", "hurt you",
#         "kill you", "i will kill", "you will die",
#         "i’ll beat you", "i will beat"
#     ]
#     if any(p in text.lower() for p in threat_phrases):
#         toxic = True

#     return {
#         "text": text,
#         "label": "toxic" if toxic else "non-toxic",
#         "risk_score": int(bert_top["score"] * 100),
#         "multi_labels": {k: round(v, 3) for k, v in rob_scores.items()},
#         "bert_label": bert_top["label"],
#         "bert_raw": round(bert_top["score"], 4)
#     }

# # --- Routes --------------------------------------------------
# @app.route("/")
# def home():
#     return "🛡️ AI Defender backend is running."

# @app.route("/analyze_batch", methods=["POST"])
# def analyze_batch():
#     try:
#         data  = request.get_json(force=True)
#         texts = data.get("texts", [])
#         url   = data.get("url", "unknown")

#         if not isinstance(texts, list) or not texts:
#             return jsonify({"error": "Invalid or missing 'texts' list"}), 400

#         results = []
#         for sentence in texts:
#             res = analyze_text(sentence)
#             results.append(res)

#             # store only toxic ones
#             if res["label"] == "toxic":
#                 collection.insert_one({
#                     "website": url,
#                     "timestamp": datetime.utcnow(),
#                     **res      # expands text, label, risk_score, multi_labels, bert_* fields
#                 })

#         return jsonify(results)

#     except Exception as exc:
#         print(f"[ERROR] /analyze_batch → {exc}")
#         return jsonify({"error": str(exc)}), 500
    
# @app.route("/api/messages", methods=["GET"])
# def get_toxic_messages():
#     """
#     Fetch all toxic messages stored in MongoDB and return as JSON list.
#     """
#     try:
#         # Find all toxic messages, sort by newest first
#         toxic_msgs_cursor = collection.find().sort("timestamp", -1)

#         messages = []
#         for msg in toxic_msgs_cursor:
#             messages.append({
#                 "text": msg.get("text"),
#                 "website": msg.get("website", "unknown"),
#                 "timestamp": msg.get("timestamp").isoformat() if msg.get("timestamp") else None,
#                 "risk_score": msg.get("risk_score"),
#                 "multi_labels": msg.get("multi_labels"),
#                 "bert_label": msg.get("bert_label"),
#                 "bert_raw": msg.get("bert_raw"),
#                 # Add other fields you want to send to frontend here
#             })

#         return jsonify(messages)

#     except Exception as exc:
#         print(f"[ERROR] /api/messages → {exc}")
#         return jsonify({"error": str(exc)}), 500


# # ------------------------------------------------------------
# if __name__ == "__main__":
#     print("🚀  AI Defender backend running at http://127.0.0.1:5000")
#     app.run(debug=True)


from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
from datetime import datetime
from pymongo import MongoClient

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- MongoDB -------------------------------------------------
client = MongoClient("mongodb://localhost:27017/")
db = client["ai_defender"]
collection = db["toxic_messages"]

# --- Models --------------------------------------------------
bert_model = pipeline(
    "text-classification",
    model="unitary/toxic-bert",
    top_k=None
)
roberta_model = pipeline(
    "text-classification",
    model="SkolkovoInstitute/roberta_toxicity_classifier",
    top_k=None
)

ROBERTA_LABELS = [
    "toxic", "severe_toxicity", "obscene",
    "identity_attack", "insult", "threat", "sexual_explicit"
]

# --- Helper --------------------------------------------------
def clean_url(raw_url):
    return raw_url.split("?")[0] if "?" in raw_url else raw_url

def analyze_text(text: str) -> dict:
    """Return toxicity analysis for a single sentence."""
    bert_output = bert_model(text)[0]
    bert_top = max(bert_output, key=lambda x: x["score"])

    rob_output = roberta_model(text)[0]
    rob_scores = {d["label"]: d["score"] for d in rob_output}

    toxic = False
    if bert_top["label"].lower() == "toxic" and bert_top["score"] > 0.65:
        toxic = True
    elif any(rob_scores.get(lbl, 0) >= 0.50 for lbl in ROBERTA_LABELS):
        toxic = True
    threat_phrases = [
        "i'm going to hurt you", "i will hurt you", "hurt you",
        "kill you", "i will kill", "you will die",
        "i’ll beat you", "i will beat"
    ]
    if any(p in text.lower() for p in threat_phrases):
        toxic = True

    return {
        "text": text,
        "label": "toxic" if toxic else "non-toxic",
        "risk_score": int(bert_top["score"] * 100),
        "multi_labels": {k: round(v, 3) for k, v in rob_scores.items()},
        "bert_label": bert_top["label"],
        "bert_raw": round(bert_top["score"], 4)
    }

# --- Routes --------------------------------------------------
@app.route("/")
def home():
    return "🛡️ AI Defender backend is running."

@app.route("/analyze_batch", methods=["POST"])
def analyze_batch():
    try:
        data = request.get_json(force=True)
        texts = data.get("texts", [])
        raw_url = data.get("url", "unknown")
        url = clean_url(raw_url)

        if not isinstance(texts, list) or not texts:
            return jsonify({"error": "Invalid or missing 'texts' list"}), 400

        results = []
        for sentence in texts:
            res = analyze_text(sentence)
            results.append(res)

            if res["label"] == "toxic":
                collection.insert_one({
                    "url": url,
                    "timestamp": datetime.utcnow(),
                    **res
                })
                print(f"[LOG] Stored toxic message from {url}: {res['text']}")

        return jsonify(results)

    except Exception as exc:
        print(f"[ERROR] /analyze_batch → {exc}")
        return jsonify({"error": str(exc)}), 500

@app.route("/api/messages", methods=["GET"])
def get_toxic_messages():
    try:
        toxic_msgs_cursor = collection.find().sort("timestamp", -1)
        messages = []
        for msg in toxic_msgs_cursor:
            messages.append({
                "text": msg.get("text"),
                "url": msg.get("url", "unknown"),
                "timestamp": msg.get("timestamp").isoformat() if msg.get("timestamp") else None,
                "risk_score": msg.get("risk_score"),
                "multi_labels": msg.get("multi_labels"),
                "bert_label": msg.get("bert_label"),
                "bert_raw": msg.get("bert_raw"),
            })
        return jsonify(messages)

    except Exception as exc:
        print(f"[ERROR] /api/messages → {exc}")
        return jsonify({"error": str(exc)}), 500

# ------------------------------------------------------------
if __name__ == "__main__":
    print("🚀 AI Defender backend running at http://127.0.0.1:5000")
    app.run(debug=True)
