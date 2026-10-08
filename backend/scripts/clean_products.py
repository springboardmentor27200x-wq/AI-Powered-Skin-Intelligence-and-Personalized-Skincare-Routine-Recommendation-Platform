"""Clean the supplied Sephora cosmetics.csv and convert USD prices to INR."""
import argparse
import os
import re
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
env_file = ROOT / "backend" / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"\''))
CATEGORY_MAP = {"moisturizer": "Moisturizer", "cleanser": "Cleanser", "face wash": "Cleanser", "sunscreen": "Sunscreen", "sun protect": "Sunscreen", "face mask": "Face Mask", "treatment": "Treatment", "serum": "Serum", "eye cream": "Eye Care", "eye treatment": "Eye Care"}


def clean_dataset(source, destination, rate):
    df = pd.read_csv(source)
    required = ["Label", "Brand", "Name", "Price", "Rank", "Ingredients", "Combination", "Dry", "Normal", "Oily", "Sensitive"]
    missing = [column for column in required if column not in df.columns]
    if missing: raise ValueError(f"Dataset is missing expected columns: {', '.join(missing)}")
    df = df[required].copy()
    df["Name"] = df["Name"].fillna("").astype(str).str.strip()
    df["Brand"] = df["Brand"].fillna("Unknown").astype(str).str.strip()
    df["Label"] = df["Label"].fillna("Other").astype(str).str.strip().str.lower().map(lambda x: CATEGORY_MAP.get(x, x.title()))
    df["Price"] = pd.to_numeric(df["Price"].astype(str).str.replace(r"[^0-9.-]", "", regex=True), errors="coerce")
    df["Rank"] = pd.to_numeric(df["Rank"], errors="coerce")
    df["Ingredients"] = df["Ingredients"].fillna("").astype(str).map(lambda x: ", ".join(re.sub(r"\s+", " ", part).strip(" ,;\t\r\n") for part in re.split(r"[,;]+", x) if part.strip(" ,;\t\r\n")))
    df = df[(df.Name != "") & df.Price.notna() & (df.Price > 0)].drop_duplicates(subset=["Brand", "Name"], keep="first")
    df["Price_INR"] = (df["Price"] * rate).round(2)
    df["source_id"] = df["Brand"].str.lower() + ":" + df["Name"].str.lower()
    df["concerns"] = ""
    df["allergens"] = ""
    df["source"] = "Kaggle Sephora cosmetics.csv; USD_TO_INR=" + str(rate)
    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(destination, index=False)
    return len(df)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(ROOT / "cosmetics.csv"))
    parser.add_argument("--output", default=str(ROOT / "backend" / "data" / "products_cleaned.csv"))
    parser.add_argument("--usd-to-inr", type=float, default=float(os.getenv("USD_TO_INR", "0")))
    args = parser.parse_args()
    if args.usd_to_inr <= 0: parser.error("Set USD_TO_INR or pass --usd-to-inr to use an explicit conversion rate.")
    print(f"Wrote {clean_dataset(args.source, args.output, args.usd_to_inr)} cleaned product rows.")
