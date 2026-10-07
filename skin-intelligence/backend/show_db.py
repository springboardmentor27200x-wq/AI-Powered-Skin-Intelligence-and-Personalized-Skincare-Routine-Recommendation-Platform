import os
from sqlalchemy import inspect, text
from database import engine

def show_database():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if not tables:
        print("No tables found in the database. Make sure the backend server has run at least once to create them.")
        return

    print("=" * 60)
    print(f"Tables found in database: {', '.join(tables)}")
    print("=" * 60)

    with engine.connect() as conn:
        for table in tables:
            print(f"\n[Table: {table}]")
            # Get columns
            columns = [col['name'] for col in inspector.get_columns(table)]
            print(f"Columns: {', '.join(columns)}")
            
            # Fetch up to 10 rows
            try:
                result = conn.execute(text(f"SELECT * FROM {table} LIMIT 10")).fetchall()
                if not result:
                    print("  (No rows in table)")
                for row in result:
                    print(f"  {row}")
            except Exception as e:
                print(f"  Error reading table data: {e}")
            print("-" * 60)

if __name__ == "__main__":
    show_database()
