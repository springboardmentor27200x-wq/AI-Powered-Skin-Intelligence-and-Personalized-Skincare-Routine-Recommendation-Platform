import random

import os
import joblib
from sklearn.metrics.pairwise import cosine_similarity
from ml.train_recommender import create_document

def recommend_products(skin_profile, all_products):
    """
    ML-based product recommender using TF-IDF and Cosine Similarity.
    """
    if not all_products:
        return []
        
    # Load trained model
    model_path = os.path.join(os.path.dirname(__file__), 'tfidf_vectorizer.joblib')
    if not os.path.exists(model_path):
        # Fallback if model hasn't been trained yet
        print("Model not found. Please run train_recommender.py")
        return all_products[:5]
        
    vectorizer = joblib.load(model_path)
    
    # 1. Create a "document" representing the user's needs
    user_concerns = " ".join(skin_profile.skin_concerns) if skin_profile.skin_concerns else ""
    user_skin_type = skin_profile.skin_type
    
    # Repeat concerns to weight them higher in similarity calculation
    user_document = f"{user_skin_type} {user_concerns} {user_concerns} {user_concerns}".lower()
    
    # 2. Vectorize the user's document
    user_vector = vectorizer.transform([user_document])
    
    # 3. Vectorize all products
    product_documents = [create_document(p) for p in all_products]
    product_vectors = vectorizer.transform(product_documents)
    
    # 4. Calculate Cosine Similarity
    similarities = cosine_similarity(user_vector, product_vectors).flatten()
    
    # 5. Pair products with their score and sort
    scored_products = list(zip(similarities, all_products))
    scored_products.sort(key=lambda x: x[0], reverse=True)
    
    # Filter out absolute 0 matches if we want, but for now just return top 5
    top_5 = [item[1] for item in scored_products[:5] if item[0] > 0.01]
    
    # If no decent match, return something
    if not top_5:
        return all_products[:5]
        
    return top_5

INGREDIENT_EDUCATION = {
    "retinol": "Anti-aging powerhouse that increases cell turnover and stimulates collagen.",
    "retinoid": "Anti-aging powerhouse that increases cell turnover and stimulates collagen.",
    "niacinamide": "Vitamin B3 that brightens skin, reduces redness, and controls sebum production.",
    "vitamin c": "Potent antioxidant that brightens the complexion and protects against environmental damage.",
    "hyaluronic acid": "Humectant that draws water into the skin for intense hydration.",
    "salicylic acid": "BHA that exfoliates deep within pores to treat and prevent breakouts.",
    "ceramides": "Lipids that help restore and maintain the skin's natural moisture barrier.",
    "peptides": "Amino acids that act as building blocks for collagen and elastin production.",
    "aha": "Alpha-hydroxy acids that exfoliate the surface for a smoother, brighter texture.",
    "bha": "Beta-hydroxy acids that unclog pores and reduce inflammation.",
    "glycolic acid": "An AHA that provides intense surface exfoliation for glowing skin.",
    "lactic acid": "A gentle AHA that exfoliates while drawing moisture to the skin."
}

def get_ingredient_analysis(ingredients, allergies):
    """
    Analyzes ingredients against user allergies.
    Returns safe ingredients, flagged ingredients, educational snippets, and interaction warnings.
    """
    flagged = []
    safe = []
    education = {}
    
    # Normalize ingredients for interaction checks
    ing_lower = [ing.lower() for ing in ingredients]
    interactions = []
    
    # Interaction Rules
    has_retinol = any('retinol' in i or 'retinoid' in i for i in ing_lower)
    has_aha_bha = any('aha' in i or 'bha' in i or 'salicylic' in i or 'glycolic' in i or 'lactic' in i for i in ing_lower)
    has_vit_c = any('vitamin c' in i or 'ascorbic' in i for i in ing_lower)
    
    if has_retinol and has_aha_bha:
        interactions.append("Combining Retinoids and exfoliating acids (AHA/BHA) increases the risk of severe irritation and barrier damage. Use on alternating nights.")
    if has_retinol and has_vit_c:
        interactions.append("Using Vitamin C and Retinol together can cause irritation. It's recommended to use Vitamin C in the morning and Retinol at night.")
    if has_aha_bha and has_vit_c:
        interactions.append("Exfoliating acids can alter the pH needed for Vitamin C to be effective, and the combo might irritate sensitive skin.")

    for ing in ingredients:
        is_allergen = False
        for allergy in allergies:
            if allergy.lower() in ing.lower():
                flagged.append(ing)
                is_allergen = True
                break
        if not is_allergen:
            safe.append(ing)
            
        # Add educational snippet
        for key, desc in INGREDIENT_EDUCATION.items():
            if key in ing.lower():
                education[ing] = desc
                break
            
    return {
        "safe_ingredients": safe,
        "flagged_ingredients": flagged,
        "is_safe_to_use": len(flagged) == 0,
        "interactions": interactions,
        "education": education
    }
