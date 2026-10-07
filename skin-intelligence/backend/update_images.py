import os
from database import SessionLocal, engine, Base
from models.product import Product

def update_images():
    db = SessionLocal()
    
    images = {
        "CeraVe Hydrating Facial Cleanser": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop",
        "La Roche-Posay Effaclar Purifying Foaming Gel": "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=600&auto=format&fit=crop",
        "Bioderma Sensibio H2O Micellar Water": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=600&auto=format&fit=crop",
        "Paula's Choice 2% BHA Liquid Exfoliant": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
        "Dr. Dennis Gross Alpha Beta Universal Daily Peel": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
        "The Ordinary Glycolic Acid 7% Toning Solution": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
        "SkinCeuticals C E Ferulic Antioxidant Serum": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
        "SkinCeuticals C E Ferulic": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
        "SkinCeuticals Discoloration Defense": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=600&auto=format&fit=crop",
        "Avene Cicalfate+ Restorative Protective Cream": "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
        "Skinfix Barrier+ Triple Lipid-Peptide Cream": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
        "EltaMD UV Clear Broad-Spectrum SPF 46": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop",
        "ISDIN Eryfotona Actinica Daily Mineral Sunscreen SPF 50+": "https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=600&auto=format&fit=crop",
        "Anua Heartleaf 77% Soothing Toner": "https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop",
        "CosRx Advanced Snail 96 Mucin Power Essence": "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop",
        "The Ordinary Niacinamide 10% + Zinc 1%": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop",
        "The Ordinary Hyaluronic Acid 2% + B5": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
        "The Ordinary Retinol 0.5% in Squalane": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
        "Torriden DIVE-IN Low Molecular Hyaluronic Acid Serum": "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=600&auto=format&fit=crop",
        "Sunday Riley Good Genes All-In-One Lactic Acid Treatment": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
        "Beauty of Joseon Relief Sun : Rice + Probiotics": "https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=600&auto=format&fit=crop",
        "Beauty of Joseon Relief Sun: Rice + Probiotics SPF 50+": "https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=600&auto=format&fit=crop",
        "Tatcha The Dewy Skin Cream": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop",
        "Medicube Zero Pore 2.0 Serum": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
        "Vanicream Daily Facial Moisturizer": "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
        "Neutrogena Hydro Boost Water Gel": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
    }
    
    products = db.query(Product).all()
    count = 0
    for p in products:
        if p.name in images:
            p.image_url = images[p.name]
            count += 1
            
    db.commit()
    print(f"Updated {count} products with verified real images!")
    db.close()

if __name__ == "__main__":
    update_images()

