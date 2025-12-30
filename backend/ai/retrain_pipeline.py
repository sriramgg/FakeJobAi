# backend/ai/retrain_pipeline.py

import pandas as pd
import torch
import torch.nn as nn
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset, DataLoader
from transformers import BertTokenizer, BertModel
import pickle
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "Dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "hybrid_model.pkl")
TOKENIZER_PATH = os.path.join(BASE_DIR, "models", "tokenizer.pkl")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "models", "label_encoder.pkl")


# PyTorch Dataset
class JobDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            truncation=True,
            padding="max_length",
            return_tensors="pt"
        )
        return {
            "input_ids": encoding["input_ids"].flatten(),
            "attention_mask": encoding["attention_mask"].flatten(),
            "labels": torch.tensor(label, dtype=torch.long)
        }


# Hybrid Model
class HybridModel(nn.Module):
    def __init__(self, bert_model_name, num_classes):
        super(HybridModel, self).__init__()
        self.bert = BertModel.from_pretrained(bert_model_name)
        self.fc = nn.Linear(self.bert.config.hidden_size, num_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        return self.fc(pooled_output)


# Retrain function
def retrain_hybrid_model():
    # Load dataset
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=["Title", "Fraudulent"])  # Ensure no missing data

    # Encode labels
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df["Fraudulent"])
    with open(LABEL_ENCODER_PATH, "wb") as f:
        pickle.dump(label_encoder, f)

    # Tokenizer
    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    with open(TOKENIZER_PATH, "wb") as f:
        pickle.dump(tokenizer, f)

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        df["Title"], y, test_size=0.2, random_state=42
    )

    # Datasets
    train_dataset = JobDataset(X_train.tolist(), y_train.tolist(), tokenizer)
    test_dataset = JobDataset(X_test.tolist(), y_test.tolist(), tokenizer)

    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=16)

    # Model
    num_classes = len(label_encoder.classes_)
    model = HybridModel("bert-base-uncased", num_classes)

    # Training setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=2e-5)
    epochs = 2  # Adjust epochs as needed

    # Training loop
    model.train()
    for epoch in range(epochs):
        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            optimizer.zero_grad()
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
        print(f"Epoch {epoch + 1}/{epochs}, Loss: {loss.item()}")

    # Save model state dict
    torch.save(model.state_dict(), MODEL_PATH)
    print("Retraining completed and model saved.")
