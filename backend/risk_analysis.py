from transformers import pipeline

# Load model once at start
classifier = pipeline("text-classification", model="unitary/toxic-bert")

def get_risk_score(text):
    result = classifier(text)[0]
    label = result['label']
    score = result['score']
    risk = round(score * 100) if label.lower() in ['toxic', 'severe_toxic', 'threat', 'insult'] else 0
    return {
        "risk_score": risk,
        "label": label
    }