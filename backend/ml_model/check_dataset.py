import pandas as pd

df = pd.read_csv("skin_dataset.csv")

print("Dataset shape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate rows:")
print(df.duplicated().sum())

print("\nSkin concern distribution:")
print(df["Skin_Concern"].value_counts())