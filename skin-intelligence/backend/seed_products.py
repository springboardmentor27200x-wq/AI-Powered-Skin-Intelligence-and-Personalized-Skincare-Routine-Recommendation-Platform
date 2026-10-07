from database import SessionLocal, engine, Base
from models.product import Product
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS products"))
    conn.commit()

Base.metadata.create_all(bind=engine)

def seed_products():
    db = SessionLocal()
    
    products = [
        # ========================================================
        # 1. DERMATOLOGY CLINICAL-GRADE PRODUCTS
        # ========================================================
        
        # --- Cleansers ---
        Product(
            name="CeraVe Hydrating Facial Cleanser",
            brand="CeraVe",
            category="Cleanser",
            product_type_tag="Dermatology Clinical",
            price="$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop",
            description="Dermatologist-developed non-foaming lotion cleanser formulated with 3 essential ceramides and hyaluronic acid to restore the protective barrier while gently lifting impurities.",
            how_to_use="Wet face with lukewarm water. Dispense 1-2 pumps onto palms and massage gently in circular motions for 60 seconds. Rinse thoroughly and pat dry with a clean towel.",
            key_benefit="Restores lipid barrier without tightness or dryness",
            ingredients=["Ceramide NP", "Ceramide AP", "Ceramide EOP", "Hyaluronic Acid", "Glycerin"],
            target_skin_types=["Dry", "Normal", "Sensitive", "Combination"],
            target_concerns=["Dry Skin", "Sensitive Skin", "Compromised Barrier", "Uneven Skin Tone"]
        ),
        Product(
            name="La Roche-Posay Effaclar Purifying Foaming Gel",
            brand="La Roche-Posay",
            category="Cleanser",
            product_type_tag="Dermatology Clinical",
            price="$$",
            rating=4.8,
            image_url="https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=600&auto=format&fit=crop",
            description="Clinical foaming cleanser with Zinc PCA specifically designed for acne-prone and oily skin to clear clogged pores and regulate sebum without overdrying.",
            how_to_use="Lather a dime-sized amount with water in hands. Apply to face focusing on T-zone (forehead, nose, chin). Rinse clean with water morning and night.",
            key_benefit="Purifies sebum flow and reduces pore congestion",
            ingredients=["Zinc PCA", "Thermal Spring Water", "Citric Acid"],
            target_skin_types=["Oily", "Combination", "Acne-Prone"],
            target_concerns=["Acne", "Oily Skin", "Enlarged Pores", "Blackheads"]
        ),
        Product(
            name="Bioderma Sensibio H2O Micellar Water",
            brand="Bioderma",
            category="Cleanser",
            product_type_tag="Dermatology Clinical",
            price="$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=600&auto=format&fit=crop",
            description="The original dermatological micellar water with biomimetic micelles that capture impurities and soothing cucumber extract for ultra-reactive skin.",
            how_to_use="Soak a soft cotton pad and gently swipe across face and eye contours. No rinsing required. Ideal as the first step of double cleansing in PM.",
            key_benefit="Calms reactive erythema while removing stubborn particles",
            ingredients=["Biomimetic Fatty Acid Esters", "Cucumber Extract", "Rhamnose", "Xylitol"],
            target_skin_types=["Sensitive", "Normal", "Dry", "All Skin Types"],
            target_concerns=["Sensitive Skin", "Redness", "Irritation"]
        ),

        # --- Toners & Exfoliants ---
        Product(
            name="Paula's Choice 2% BHA Liquid Exfoliant",
            brand="Paula's Choice",
            category="Exfoliant",
            product_type_tag="Dermatology Clinical",
            price="$$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
            description="Clinically proven 2% Salicylic Acid (BHA) fluid that penetrates deep inside pores to dissolve dead skin cells, clear blackheads, and refine surface texture.",
            how_to_use="Apply lightly with fingers or cotton pad over entire face after cleansing. Do not rinse. Start using 2-3 nights per week, increasing to nightly if tolerated. Always wear SPF daytime.",
            key_benefit="Unclogs deep pores, smooths bumps, and refines rough texture",
            ingredients=["Salicylic Acid", "Green Tea Extract", "Methylpropanediol"],
            target_skin_types=["Oily", "Combination", "Acne-Prone", "Normal"],
            target_concerns=["Acne", "Large Pores", "Uneven Skin Tone", "Rough Texture"]
        ),
        Product(
            name="Dr. Dennis Gross Alpha Beta Universal Daily Peel",
            brand="Dr. Dennis Gross",
            category="Exfoliant",
            product_type_tag="Dermatology Clinical",
            price="$$$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
            description="Patented 2-step clinical chemical peel pads powered by 5 AHA/BHAs plus antioxidants to smooth micro-roughness, diminish fine lines, and boost cellular turnover.",
            how_to_use="Gently massage Step 1 pad onto clean, dry skin until dry. Wait 2 minutes. Follow with Step 2 pad. Do not rinse. Use 2-3x weekly in PM.",
            key_benefit="Dramatically accelerates cellular renewal and smooths uneven texture",
            ingredients=["Glycolic Acid", "Lactic Acid", "Salicylic Acid", "Malic Acid", "Resveratrol", "Green Tea"],
            target_skin_types=["Normal", "Combination", "Oily", "Mature"],
            target_concerns=["Uneven Skin Tone", "Fine Lines", "Wrinkles", "Dullness"]
        ),

        # --- Serums & Treatments ---
        Product(
            name="SkinCeuticals C E Ferulic Antioxidant Serum",
            brand="SkinCeuticals",
            category="Serum",
            product_type_tag="Dermatology Clinical",
            price="$$$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
            description="The gold-standard clinical antioxidant serum with 15% Pure Vitamin C (L-Ascorbic Acid), 1% Vitamin E, and 0.5% Ferulic Acid. Clinically proven to reduce oxidative UV damage up to 8x.",
            how_to_use="In the morning after cleansing, apply 4-5 drops to a dry face, neck, and chest before other anti-aging skincare products. Follow with moisturizer and SPF 50+.",
            key_benefit="Fades stubborn dark spots, prevents photoaging, and firms skin",
            ingredients=["L-Ascorbic Acid (Vitamin C)", "Alpha Tocopherol (Vitamin E)", "Ferulic Acid", "Hyaluronic Acid"],
            target_skin_types=["Dry", "Normal", "Combination", "Sensitive"],
            target_concerns=["Hyperpigmentation", "Dark Spots", "Fine Lines", "Wrinkles", "Uneven Skin Tone"]
        ),
        Product(
            name="SkinCeuticals Discoloration Defense",
            brand="SkinCeuticals",
            category="Serum",
            product_type_tag="Dermatology Clinical",
            price="$$$$",
            rating=4.8,
            image_url="https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=600&auto=format&fit=crop",
            description="Clinical dark spot corrector featuring 3% Tranexamic Acid, 1% Kojic Acid, and 5% Niacinamide to target stubborn post-acne marks and melasma.",
            how_to_use="Apply 3-5 drops twice daily to clean skin. Layer before heavy creams. Use daily sun protection.",
            key_benefit="Inhibits melanin transfer and visibly diminishes hyperpigmentation",
            ingredients=["Tranexamic Acid", "Kojic Acid", "Niacinamide", "HEPES"],
            target_skin_types=["All Skin Types", "Combination", "Normal", "Oily"],
            target_concerns=["Hyperpigmentation", "Dark Spots", "Acne Scars"]
        ),
        Product(
            name="Avene Cicalfate+ Restorative Protective Cream",
            brand="Avene",
            category="Moisturizer",
            product_type_tag="Dermatology Clinical",
            price="$$",
            rating=4.8,
            image_url="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop",
            description="Postbiotic recovery cream with [C+-Restore] and Copper-Zinc sulfate complex to soothe compromised, post-procedure, or severely irritated skin.",
            how_to_use="Apply twice daily to affected dry or reactive areas after gentle cleansing. Warm a pea-sized amount between fingers and press into skin.",
            key_benefit="Rapidly repairs barrier integrity and halts micro-inflammation",
            ingredients=["Thermal Spring Water", "Copper Sulfate", "Zinc Sulfate", "C-Restore Complex"],
            target_skin_types=["Sensitive", "Dry", "Compromised"],
            target_concerns=["Redness", "Sensitive Skin", "Barrier Breakdown", "Dry Skin"]
        ),
        Product(
            name="Skinfix Barrier+ Triple Lipid-Peptide Cream",
            brand="Skinfix",
            category="Moisturizer",
            product_type_tag="Dermatology Clinical",
            price="$$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=600&auto=format&fit=crop",
            description="Dermatologist-tested rich cream containing patented Triple Lipid Complex (ceramides, fatty acids, cholesterol) and active firming Nutripeptides.",
            how_to_use="Press 1-2 pumps onto face and neck morning and evening. Perfect as the lock-in step over active serums.",
            key_benefit="Replenishes essential epidermal lipids and reinforces hydration reservoir",
            ingredients=["Triple Lipid Complex", "Nutripeptides", "Shea Butter", "Hyaluronic Acid"],
            target_skin_types=["Dry", "Normal", "Sensitive", "Mature"],
            target_concerns=["Dry Skin", "Fine Lines", "Wrinkles", "Sensitive Skin"]
        ),

        # --- Sunscreens ---
        Product(
            name="EltaMD UV Clear Broad-Spectrum SPF 46",
            brand="EltaMD",
            category="Sunscreen",
            product_type_tag="Dermatology Clinical",
            price="$$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop",
            description="#1 Dermatologist-recommended facial sunscreen. Formulated with 9% transparent Zinc Oxide, 5% high-purity Niacinamide, and Hyaluronic Acid to protect and calm acne and rosacea-prone skin.",
            how_to_use="Apply liberally to face and neck 15 minutes before sun exposure (two finger-lengths). Reapply at least every 2 hours when outdoors.",
            key_benefit="Weightless, non-comedogenic UV shield that calms redness and prevents breakouts",
            ingredients=["Zinc Oxide 9.0%", "Niacinamide 5.0%", "Hyaluronic Acid", "Vitamin E"],
            target_skin_types=["Acne-Prone", "Sensitive", "Oily", "Combination"],
            target_concerns=["Acne", "Redness", "Sun Damage", "Hyperpigmentation"]
        ),
        Product(
            name="ISDIN Eryfotona Actinica Daily Mineral Sunscreen SPF 50+",
            brand="ISDIN",
            category="Sunscreen",
            product_type_tag="Dermatology Clinical",
            price="$$$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=600&auto=format&fit=crop",
            description="Advanced clinical fluid sunscreen with 100% mineral Zinc Oxide and DNA Repairsomes (photolyase enzymes) proven to repair existing sun-induced cellular damage.",
            how_to_use="Shake well before use. Apply 2 finger lengths evenly to face, ears, and neck every morning as the final skincare step.",
            key_benefit="Repairs actinic UV damage and provides high-potency photoprotection",
            ingredients=["Zinc Oxide 11%", "DNA Repairsomes (Photolyase)", "Vitamin E", "Antioxidants"],
            target_skin_types=["All Skin Types", "Mature", "Sensitive", "Normal"],
            target_concerns=["Sun Damage", "Wrinkles", "Hyperpigmentation", "Aging"]
        ),

        # ========================================================
        # 2. MARKET-TRENDY & VIRAL / CULT CULT FAVORITES
        # ========================================================
        
        # --- K-Beauty & Viral Toners/Essences ---
        Product(
            name="Anua Heartleaf 77% Soothing Toner",
            brand="Anua",
            category="Toner",
            product_type_tag="Market Trendy",
            price="$$",
            rating=4.8,
            image_url="https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop",
            description="Viral Korean soothing toner packed with 77% Houttuynia Cordata (Heartleaf) extract grown in Korea to reduce redness, cool irritated skin, and optimize pH balance.",
            how_to_use="After cleansing, dispense generous amount onto hands or a cotton pad. Gently pat across the face until fully absorbed. Layer 2-3 times for intense hydration.",
            key_benefit="Instantly relieves facial erythema and micro-irritation",
            ingredients=["Heartleaf Extract 77%", "Centella Asiatica", "Panthenol", "Sugar Cane Extract"],
            target_skin_types=["Sensitive", "Acne-Prone", "Combination", "Oily"],
            target_concerns=["Redness", "Sensitive Skin", "Acne", "Rough Texture"]
        ),
        Product(
            name="CosRx Advanced Snail 96 Mucin Power Essence",
            brand="CosRx",
            category="Serum",
            product_type_tag="Market Trendy",
            price="$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop",
            description="Cult-classic lightweight essence enriched with 96.3% Snail Secretion Filtrate. Plumps skin with moisture, smooths rough texture, and delivers an unmistakable glass-skin glow.",
            how_to_use="After cleansing and toning, pump 2-3 times onto palms and gently press and pat into slightly damp skin. Follow with moisturizer.",
            key_benefit="Glass skin radiance and high-potency texture smoothing",
            ingredients=["Snail Secretion Filtrate 96.3%", "Sodium Hyaluronate", "Allantoin", "Panthenol", "Arginine"],
            target_skin_types=["All Skin Types", "Dry", "Combination", "Dehydrated"],
            target_concerns=["Dry Skin", "Uneven Skin Tone", "Rough Texture", "Dullness"]
        ),
        Product(
            name="The Ordinary Niacinamide 10% + Zinc 1%",
            brand="The Ordinary",
            category="Serum",
            product_type_tag="Market Trendy",
            price="$",
            rating=4.7,
            image_url="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop",
            description="Global top-selling high-strength vitamin and mineral blemish formula that visibly minimizes enlarged pores, regulates excess oil shine, and evens out skin tone.",
            how_to_use="Apply 2-3 drops to entire face morning and evening before heavier creams. If irritation occurs, alternate days. Do not combine directly with pure Vitamin C.",
            key_benefit="Reduces pore prominence and controls midday sebum shine",
            ingredients=["Niacinamide 10%", "Zinc PCA 1%", "Tamarindus Indica Seed Gum"],
            target_skin_types=["Oily", "Combination", "Acne-Prone"],
            target_concerns=["Acne", "Oily Skin", "Large Pores", "Uneven Skin Tone"]
        ),
        Product(
            name="The Ordinary Hyaluronic Acid 2% + B5",
            brand="The Ordinary",
            category="Serum",
            product_type_tag="Market Trendy",
            price="$",
            rating=4.8,
            image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
            description="Formulated with low, medium, and high molecular weight Hyaluronic Acid plus next-gen HA crosspolymer and Provitamin B5 to hydrate multi-depth epidermal layers.",
            how_to_use="Apply a few drops to clean, damp skin in AM and PM before oils and creams. Pat gently until absorbed.",
            key_benefit="Deep multi-depth hydration and bouncy skin plumpness",
            ingredients=["Hyaluronic Acid 2%", "Provitamin B5 (Panthenol)", "Ahnfeltia Concinna Extract"],
            target_skin_types=["Dry", "Dehydrated", "Normal", "All Skin Types"],
            target_concerns=["Dry Skin", "Dehydration", "Fine Lines"]
        ),
        Product(
            name="The Ordinary Retinol 0.5% in Squalane",
            brand="The Ordinary",
            category="Serum",
            product_type_tag="Market Trendy",
            price="$",
            rating=4.7,
            image_url="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
            description="Water-free solution containing 0.5% pure Retinol in soothing Squalane base to diminish the appearance of fine lines, photodamage, and general skin aging.",
            how_to_use="Apply a small amount (2-3 drops) to face in the PM only, as part of your skincare regimen. Start 2 nights per week and build tolerance. Never skip daytime SPF.",
            key_benefit="Accelerates nighttime cell turnover and smooths expression lines",
            ingredients=["Pure Retinol 0.5%", "Plant-Derived Squalane", "Jojoba Seed Oil", "Tomato Fruit Extract"],
            target_skin_types=["Normal", "Dry", "Combination", "Mature"],
            target_concerns=["Fine Lines", "Wrinkles", "Uneven Skin Tone", "Loss of Elasticity"]
        ),
        Product(
            name="Torriden DIVE-IN Low Molecular Hyaluronic Acid Serum",
            brand="Torriden",
            category="Serum",
            product_type_tag="Market Trendy",
            price="$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=600&auto=format&fit=crop",
            description="Award-winning Korean moisture serum with 5D-Complex Hyaluronic Acid and Malachite extract for instant deep moisture penetration without stickiness.",
            how_to_use="Pump 3-4 drops onto face and gently smooth across skin. Pat for 30 seconds for complete absorption before moisturizing.",
            key_benefit="Zero-stickiness deep quenching for dehydrated inner skin layers",
            ingredients=["5D Complex Hyaluronic Acid", "D-Panthenol", "Allantoin", "Madecassoside"],
            target_skin_types=["Dehydrated", "Combination", "Sensitive", "Oily"],
            target_concerns=["Dry Skin", "Dehydration", "Redness", "Tightness"]
        ),
        Product(
            name="Sunday Riley Good Genes All-In-One Lactic Acid Treatment",
            brand="Sunday Riley",
            category="Serum",
            product_type_tag="Market Trendy",
            price="$$$$",
            rating=4.8,
            image_url="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
            description="High-potency purified Lactic Acid serum that instantly exfoliates dull surface cells to clarify hyperpigmentation, boost radiance, and refine pore texture.",
            how_to_use="Apply 1-2 pumps to clean, dry skin as a leave-on treatment at night. Sensitive skin types can use it as a 15-minute wash-off mask.",
            key_benefit="Instant overnight radiance boost and micro-texture refinement",
            ingredients=["Purified Lactic Acid", "Licorice Root Extract", "Lemongrass", "Arnica"],
            target_skin_types=["All Skin Types", "Dull", "Mature", "Combination"],
            target_concerns=["Uneven Skin Tone", "Dark Spots", "Dullness", "Fine Lines"]
        ),
        Product(
            name="Beauty of Joseon Relief Sun: Rice + Probiotics SPF 50+",
            brand="Beauty of Joseon",
            category="Sunscreen",
            product_type_tag="Market Trendy",
            price="$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=600&auto=format&fit=crop",
            description="Viral organic sunscreen formulated with 30% Rice Extract and Grain Fermented Probiotics. Melts into skin like a dewy moisturizer with zero white cast or stickiness.",
            how_to_use="Apply two generous finger lengths to face and neck as the final step of morning routine. Reapply every 2 hours under direct sunlight.",
            key_benefit="Dewy, nourishing UV shield with lightweight moisturizer finish",
            ingredients=["Rice Extract 30%", "Grain Probiotics Complex", "Niacinamide 2%", "Adenosine"],
            target_skin_types=["Dry", "Normal", "Combination", "Sensitive"],
            target_concerns=["Sun Protection", "Dry Skin", "Dullness"]
        ),
        Product(
            name="Tatcha The Dewy Skin Cream",
            brand="Tatcha",
            category="Moisturizer",
            product_type_tag="Market Trendy",
            price="$$$$",
            rating=4.9,
            image_url="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop",
            description="Luxury rich antioxidant cream infused with Japanese Purple Rice, Okinawa Algae Blend, and Hyaluronic Acid to feed skin with intense hydration and a dewy luminous finish.",
            how_to_use="Scoop a pearl-sized amount with the gold spoon. Massage gently onto face, neck, and decolletage in upward strokes morning and night.",
            key_benefit="Deep antioxidant barrier protection and instant dewy luminosity",
            ingredients=["Japanese Purple Rice", "Hadasei-3 Trinity", "Hyaluronic Acid", "Botanical Extracts"],
            target_skin_types=["Dry", "Normal", "Mature"],
            target_concerns=["Dry Skin", "Fine Lines", "Dullness", "Loss of Elasticity"]
        ),
        Product(
            name="Medicube Zero Pore 2.0 Serum",
            brand="Medicube",
            category="Serum",
            product_type_tag="Market Trendy",
            price="$$$",
            rating=4.8,
            image_url="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop",
            description="Clinically certified pore-tightening serum featuring patented Anti-Sebum P and Camellia Japonica to shrink enlarged pore size and regulate oil secretion.",
            how_to_use="After toner, pump 2-3 drops and spread across cheeks, nose, and forehead. Tap gently to boost absorption.",
            key_benefit="Clinically minimizes pore circumference and regulates sebum production",
            ingredients=["Anti-Sebum P", "Camellia Japonica Extract", "Lemongrass Extract", "Hyaluronic Acid"],
            target_skin_types=["Oily", "Combination", "Enlarged Pores"],
            target_concerns=["Large Pores", "Oily Skin", "Rough Texture"]
        )
    ]
    
    for p in products:
        db.add(p)
        
    db.commit()
    print(f"Successfully seeded {len(products)} Clinical Dermatology & Market Trendy products!")
    db.close()

if __name__ == "__main__":
    seed_products()
