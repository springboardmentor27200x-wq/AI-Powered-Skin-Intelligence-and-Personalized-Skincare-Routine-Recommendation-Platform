"""Apply additive schema updates to an existing database."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
import os
env_file = ROOT / "backend" / ".env"
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"\''))
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.database import Base, engine
from app import models
from sqlalchemy import inspect, text

Base.metadata.create_all(bind=engine)
if "budget_inr" not in {column["name"] for column in inspect(engine).get_columns("skin_profiles")}:
    with engine.begin() as connection: connection.execute(text("ALTER TABLE skin_profiles ADD COLUMN budget_inr FLOAT"))
print("Schema migration complete.")
