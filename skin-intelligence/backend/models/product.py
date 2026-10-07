from sqlalchemy import Column, Integer, String, Boolean, Float, JSON
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    brand = Column(String, index=True)
    category = Column(String)  # e.g., Cleanser, Serum, Moisturizer, Sunscreen, Exfoliant, Toner, Eye Cream
    description = Column(String)
    price = Column(String)  # Storing as string for simplicity e.g. "$$ - Moderate", "$$$"
    image_url = Column(String, nullable=True)
    
    # Classification: "Dermatology Clinical", "Market Trendy", "K-Beauty Viral"
    product_type_tag = Column(String, default="Dermatology Clinical")
    
    # Clinical how to use instructions
    how_to_use = Column(String, nullable=True)
    key_benefit = Column(String, nullable=True)
    rating = Column(Float, default=4.8)
    
    # Store ingredients as JSON array of strings
    ingredients = Column(JSON, default=list)
    
    # List of skin types this is good for
    target_skin_types = Column(JSON, default=list)
    
    # List of concerns this product addresses
    target_concerns = Column(JSON, default=list)
    
    # Is it currently available/active in our database
    is_active = Column(Boolean, default=True)
