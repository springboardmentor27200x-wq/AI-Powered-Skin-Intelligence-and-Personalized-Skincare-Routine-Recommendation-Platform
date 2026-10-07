import os
import sys
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

# Add the parent directory to the path so we can import from database and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.product import Product

def create_document(product):
    """Combine product features into a single text document for TF-IDF."""
    category = product.category or ""
    ingredients = " ".join(product.ingredients) if product.ingredients else ""
    skin_types = " ".join(product.target_skin_types) if product.target_skin_types else ""
    concerns = " ".join(product.target_concerns) if product.target_concerns else ""
    
    # Weight concerns higher by repeating them
    document = f"{category} {ingredients} {skin_types} {concerns} {concerns}"
    return document.lower()

def train_and_save_recommender():
    db = SessionLocal()
    products = db.query(Product).filter(Product.is_active == True).all()
    
    if not products:
        print("No active products found in the database. Please seed products first.")
        return
        
    print(f"Training TF-IDF model on {len(products)} products...")
    
    documents = [create_document(p) for p in products]
    
    # Initialize and train TF-IDF Vectorizer
    # stop_words='english' removes common words like 'the', 'is', 'and'
    vectorizer = TfidfVectorizer(stop_words='english')
    vectorizer.fit(documents)
    
    # Save the vectorizer
    model_path = os.path.join(os.path.dirname(__file__), 'tfidf_vectorizer.joblib')
    joblib.dump(vectorizer, model_path)
    
    print(f"Model successfully saved to {model_path}")
    db.close()

if __name__ == '__main__':
    train_and_save_recommender()
