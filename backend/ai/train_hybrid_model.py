import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, \
    f1_score

# ================= PATH SETUP =================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "dataset", "Dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "models", "tfidf_vectorizer.pkl")

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

print(f"📂 Loading dataset from: {DATA_PATH}")

# ================= LOAD DATA =================
df = pd.read_csv(DATA_PATH)
print(f"✅ Dataset Loaded: {df.shape}")

# Normalize column names (strip spaces, consistent case)
df.columns = [col.strip().capitalize() for col in df.columns]

# Ensure the target column exists
if "Fraudulent" not in df.columns:
    raise ValueError("❌ 'Fraudulent' column is missing in dataset!")

# Reverse labels (1 = real, 0 = fake)
#df["Fraudulent"] = df["Fraudulent"].apply(lambda x: 1 if x == 0 else 0)

# Combine useful text columns for feature extraction
text_columns = [
    "Title", "Description", "Location", "Company_profile",
    "Requirements", "Benefits", "Required_experience",
    "Required_education", "Industry", "Function"
]

df[text_columns] = df[text_columns].fillna("")

df["combined_text"] = df[text_columns].apply(lambda x: " ".join(x.astype(str)), axis=1)

# ================= FEATURES & TARGET =================
X = df["combined_text"]
y = df["Fraudulent"]

# ================= SPLIT DATA =================
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ================= TF-IDF VECTORIZER =================
vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# ================= TRAIN MODELS =================
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Random Forest": RandomForestClassifier(n_estimators=200, random_state=42),
    "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric="logloss")
}

results = []

for name, model in models.items():
    model.fit(X_train_tfidf, y_train)
    y_pred = model.predict(X_test_tfidf)
    print(f"\n📊 {name}")
    print(classification_report(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    results.append({
        "Model": name,
        "Accuracy": accuracy_score(y_test, y_pred),
        "Precision": precision_score(y_test, y_pred),
        "Recall": recall_score(y_test, y_pred),
        "F1-Score": f1_score(y_test, y_pred)
    })

# ================= RESULTS COMPARISON =================
results_df = pd.DataFrame(results)
print("\n🔹 Model Comparison:")
print(results_df)

# ================= SELECT BEST MODEL =================
best_model_name = results_df.loc[results_df["F1-Score"].idxmax(), "Model"]
best_model = models[best_model_name]
print(f"\n✅ Best Model: {best_model_name}")

# ================= SAVE MODEL & VECTORIZER =================
joblib.dump(best_model, MODEL_PATH)
joblib.dump(vectorizer, VECTORIZER_PATH)
print(f"💾 Model saved to: {MODEL_PATH}")
print(f"💾 Vectorizer saved to: {VECTORIZER_PATH}")

# ================= FEATURE IMPORTANCE (for RF/XGB) =================
if hasattr(best_model, "feature_importances_"):
    importances = best_model.feature_importances_
    indices = np.argsort(importances)[-15:]
    plt.figure(figsize=(8, 6))
    plt.barh(range(len(indices)), importances[indices], align='center')
    plt.yticks(range(len(indices)), [vectorizer.get_feature_names_out()[i] for i in indices])
    plt.xlabel("Feature Importance")
    plt.title(f"Top Features - {best_model_name}")
    plt.tight_layout()
    plt.show()
