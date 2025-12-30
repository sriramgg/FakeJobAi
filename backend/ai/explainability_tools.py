# backend/ai/explainability_tools.py
import pickle
from backend.utils.explain import explain_prediction

MODEL_PATH = "../models/hybrid_model.pkl"
TOKENIZER_PATH = "../models/tokenizer.pkl"

# Load model and tokenizer
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)
with open(TOKENIZER_PATH, "rb") as f:
    vectorizer = pickle.load(f)

def get_explanation(texts):
    return explain_prediction(texts, model, vectorizer)
