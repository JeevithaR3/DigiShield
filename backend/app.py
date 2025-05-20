from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
from pymongo import MongoClient
from datetime import datetime
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)  # Enable CORS globally

# MongoDB setup
mongo_client = MongoClient("mongodb://localhost:27017/")  # Update URI if needed
db = mongo_client["aidefender_db"]
collection = db["toxic_logs"]

# Load the Toxic BERT model
toxic_classifier = pipeline("text-classification", model="unitary/toxic-bert")

# Load the Skolkovo Institute multi-label classifier
multi_model_name = "SkolkovoInstitute/roberta_toxicity_classifier"
multi_tokenizer = AutoTokenizer.from_pretrained(multi_model_name)
multi_model = AutoModelForSequenceClassification.from_pretrained(multi_model_name)
multi_model.eval()

LABELS = ['toxicity', 'severe_toxicity', 'obscene', 'identity_attack', 'insult', 'threat', 'sexual_explicit']

def classify_multilabel(text):
    inputs = multi_tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = multi_model(**inputs)
    scores = torch.sigmoid(outputs.logits).squeeze().tolist()
    return dict(zip(LABELS, [round(s, 3) for s in scores]))

@app.route('/analyze_batch', methods=['POST'])
def analyze_batch():
    data = request.get_json()
    texts = data.get("texts", [])
    url = data.get("url", "")  # new: get current page URL from frontend

    if not texts:
        return jsonify([])

    results = []
    for text in texts:
        toxic_result = toxic_classifier(text)[0]
        multilabels = classify_multilabel(text)
        risk_score = int(toxic_result["score"] * 100)

        results.append({
            "text": text,
            "label": toxic_result["label"],
            "risk_score": risk_score,
            "multi_labels": multilabels
        })

        # Log to MongoDB only if toxic or multi-label score >= 0.5
        if toxic_result["label"].lower() == "toxic" or any(score >= 0.5 for score in multilabels.values()):
            website = ""
            if url:
                try:
                    website = urlparse(url).netloc
                except:
                    website = url

            collection.insert_one({
                "website": website,
                "timestamp": datetime.utcnow(),
                "text": text,
                "label": toxic_result["label"],
                "risk_score": risk_score,
                "multi_labels": multilabels
            })

    return jsonify(results)


@app.route('/dashboard', methods=['GET'])
def dashboard():
    logs = list(collection.find().sort("timestamp", -1))

    html = """
    <html>
    <head>
        <title>AI Defender Parent Dashboard</title>
        <style>
            table {border-collapse: collapse; width: 100%;}
            th, td {border: 1px solid #ccc; padding: 8px; text-align: left;}
            th {background-color: #f2f2f2;}
        </style>
    </head>
    <body>
        <h2>AI Defender - Toxic Content Logs</h2>
        <table>
            <tr>
                <th>Website</th>
                <th>Timestamp (UTC)</th>
                <th>Content</th>
                <th>Label</th>
                <th>Risk Score</th>
            </tr>
    """

    for entry in logs:
        html += f"""
        <tr>
            <td>{entry.get('website', '')}</td>
            <td>{entry.get('timestamp').strftime('%Y-%m-%d %H:%M:%S')}</td>
            <td>{entry.get('text')}</td>
            <td>{entry.get('label')}</td>
            <td>{entry.get('risk_score')}</td>
        </tr>
        """

    html += """
        </table>
    </body>
    </html>
    """
    return html


if __name__ == '__main__':
    print("Flask server running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
