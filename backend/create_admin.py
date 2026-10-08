from app.database import SessionLocal
from app.models import User
from app.auth import hash_password


db = SessionLocal()

try:
    admin_email = "admin@skinintelligence.com"

    existing_admin = db.query(User).filter(
        User.email == admin_email
    ).first()

    if existing_admin:
        existing_admin.role = "admin"
        db.commit()

        print("Admin already exists.")
        print("Role updated to: admin")

    else:
        admin = User(
            name="System Admin",
            email=admin_email,
            password=hash_password("Admin@123"),
            role="admin",
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin account created successfully!")
        print("Email: admin@skinintelligence.com")
        print("Password: Admin@123")
        print("Role: admin")

finally:
    db.close()