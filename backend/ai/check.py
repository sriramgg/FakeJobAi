import pandas as pd

df = pd.read_csv(r"D:\Ai\backend\dataset\Dataset.csv")
print("📋 Columns in your dataset:\n")
print(df.columns.tolist())
