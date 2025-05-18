from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

app = Flask(__name__)
CORS(app)  # Enable CORS globally

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

    if not texts:
        return jsonify([])

    results = []
    for text in texts:
        toxic_result = toxic_classifier(text)[0]
        multilabels = classify_multilabel(text)
        results.append({
            "text": text,
            "label": toxic_result["label"],
            "risk_score": int(toxic_result["score"] * 100),
            "multi_labels": multilabels
        })

    return jsonify(results)

if __name__ == '__main__':
    print("Flask server running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)