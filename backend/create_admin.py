import sqlite3
import os
from getpass import getpass
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "skinai.db")

print("\n===================================")
print("       SkinAI Admin Account")
print("===================================\n")

name = input("Admin Name: ").strip()
email = input("Admin Email: ").strip().lower()
password = getpass("Admin Password: ")

if not name or not email or not password:
    print("\nAll fields are required.")
    exit()

connection = sqlite3.connect(DB_PATH)

try:
    existing = connection.execute(
        """
        SELECT id
        FROM users
        WHERE lower(email)=?
        """,
        (email,)
    ).fetchone()

    if existing:

        connection.execute(
            """
            UPDATE users
            SET
                name=?,
                password=?,
                role='Admin'
            WHERE lower(email)=?
            """,
            (
                name,
                password,
                email
            )
        )

        print("\nExisting account converted to Admin.")

    else:

        connection.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password,
                role,
                created_at
            )
            VALUES (?, ?, ?, 'Admin', ?)
            """,
            (
                name,
                email,
                password,
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )
        )

        print("\nAdmin account created successfully.")

    connection.commit()

    print("\n-----------------------------------")
    print("Admin Email :", email)
    print("Role        : Admin")
    print("-----------------------------------")
    print("\nYou can now login through SkinAI.")

finally:
    connection.close()