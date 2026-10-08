"""6f7a8b9c0d1e_milestone_3_ingredients_products_progress

Revision ID: 6f7a8b9c0d1e
Revises: 5e6f7a8b9c0d
Create Date: 2026-09-17

Adds:
- ingredients: canonical ingredient knowledge base (Module 5)
- ingredient_interactions: pairwise interaction rules (Module 5)
- products: product catalog (Module 6)
- product_recommendations: recommendation audit trail (Module 6)
- progress_snapshots: per-assessment skin health snapshots (Module 8)
- seed data: 8 canonical ingredients + 28 seed products
"""
from alembic import op
import sqlalchemy as sa

revision = '6f7a8b9c0d1e'
down_revision = '5e6f7a8b9c0d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. ingredients ──────────────────────────────────────────────────────
    op.create_table(
        'ingredients',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('normalized_name', sa.String(200), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('common_uses', sa.Text(), nullable=True),
        sa.Column('suitability_notes', sa.Text(), nullable=True),
        sa.Column('caution_notes', sa.Text(), nullable=True),
        sa.Column('education_content', sa.Text(), nullable=True),
        sa.Column('aliases', sa.JSON(), nullable=True),
        sa.Column('suitable_for', sa.JSON(), nullable=True),
        sa.Column('caution_for', sa.JSON(), nullable=True),
        sa.Column('avoid_for', sa.JSON(), nullable=True),
        sa.Column('target_concerns', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index(op.f('ix_ingredients_name'), 'ingredients', ['name'], unique=True)
    op.create_index(op.f('ix_ingredients_normalized_name'), 'ingredients', ['normalized_name'], unique=False)
    op.create_index(op.f('ix_ingredients_category'), 'ingredients', ['category'], unique=False)

    # ── 2. ingredient_interactions ──────────────────────────────────────────
    op.create_table(
        'ingredient_interactions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('ingredient_a_id', sa.Uuid(), nullable=False),
        sa.Column('ingredient_b_id', sa.Uuid(), nullable=False),
        sa.Column('interaction_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, server_default='MODERATE'),
        sa.Column('recommendation', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['ingredient_a_id'], ['ingredients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ingredient_b_id'], ['ingredients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_ingredient_interactions_ingredient_a_id'), 'ingredient_interactions', ['ingredient_a_id'])
    op.create_index(op.f('ix_ingredient_interactions_ingredient_b_id'), 'ingredient_interactions', ['ingredient_b_id'])

    # ── 3. products ──────────────────────────────────────────────────────────
    op.create_table(
        'products',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('brand', sa.String(200), nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(10), nullable=False, server_default='INR'),
        sa.Column('size', sa.String(50), nullable=True),
        sa.Column('product_url', sa.String(500), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('ingredients', sa.JSON(), nullable=True),
        sa.Column('active_ingredients', sa.JSON(), nullable=True),
        sa.Column('skin_types', sa.JSON(), nullable=True),
        sa.Column('target_concerns', sa.JSON(), nullable=True),
        sa.Column('sensitivity_flags', sa.JSON(), nullable=True),
        sa.Column('budget_band', sa.String(20), nullable=False, server_default='MODERATE'),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_seed_data', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_category'), 'products', ['category'], unique=False)

    # ── 4. product_recommendations ───────────────────────────────────────────
    op.create_table(
        'product_recommendations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('product_id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=True),
        sa.Column('recommendation_status', sa.String(30), nullable=False, server_default='RECOMMENDED'),
        sa.Column('match_score', sa.Integer(), nullable=True),
        sa.Column('reasons', sa.JSON(), nullable=True),
        sa.Column('safety_status', sa.String(50), nullable=True),
        sa.Column('exclusion_reason', sa.String(100), nullable=True),
        sa.Column('profile_factors', sa.JSON(), nullable=True),
        sa.Column('ingredient_factors', sa.JSON(), nullable=True),
        sa.Column('budget_band', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assessment_id'], ['skin_assessments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_product_recommendations_user_id'), 'product_recommendations', ['user_id'])
    op.create_index(op.f('ix_product_recommendations_product_id'), 'product_recommendations', ['product_id'])
    op.create_index('idx_prod_rec_user_created', 'product_recommendations', ['user_id', 'created_at'])

    # ── 5. progress_snapshots ────────────────────────────────────────────────
    op.create_table(
        'progress_snapshots',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=False),
        sa.Column('snapshot_date', sa.String(20), nullable=False),
        sa.Column('overall_score', sa.Integer(), nullable=False),
        sa.Column('skin_condition_score', sa.Integer(), nullable=True),
        sa.Column('lifestyle_score', sa.Integer(), nullable=True),
        sa.Column('sleep_score', sa.Integer(), nullable=True),
        sa.Column('routine_consistency_score', sa.Integer(), nullable=True),
        sa.Column('hydration_score', sa.Integer(), nullable=True),
        sa.Column('concern_values', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assessment_id'], ['skin_assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id'),
    )
    op.create_index(op.f('ix_progress_snapshots_user_id'), 'progress_snapshots', ['user_id'])
    op.create_index(op.f('ix_progress_snapshots_snapshot_date'), 'progress_snapshots', ['snapshot_date'])

    # ── 6. Seed: Ingredients ─────────────────────────────────────────────────
    import uuid as _uuid
    ingredients_table = sa.table(
        'ingredients',
        sa.column('id', sa.Uuid()),
        sa.column('name', sa.String),
        sa.column('normalized_name', sa.String),
        sa.column('category', sa.String),
        sa.column('description', sa.Text),
        sa.column('common_uses', sa.Text),
        sa.column('suitability_notes', sa.Text),
        sa.column('caution_notes', sa.Text),
        sa.column('education_content', sa.Text),
        sa.column('aliases', sa.JSON),
        sa.column('suitable_for', sa.JSON),
        sa.column('caution_for', sa.JSON),
        sa.column('avoid_for', sa.JSON),
        sa.column('target_concerns', sa.JSON),
        sa.column('is_active', sa.Boolean),
    )
    op.bulk_insert(ingredients_table, [
        {
            "id": _uuid.uuid4(), "name": "Niacinamide", "normalized_name": "niacinamide",
            "category": "NIACINAMIDE",
            "description": "A water-soluble form of vitamin B3 used widely in skincare.",
            "common_uses": "Commonly used to support the appearance of uneven skin tone, visible pores, and surface oiliness.",
            "suitability_notes": "May be suitable for all skin types, including oily and combination skin. Often well-tolerated.",
            "caution_notes": "Some individuals may experience mild flushing at high concentrations (above 10%). Start with lower concentrations.",
            "education_content": "Niacinamide is a form of vitamin B3. In skincare, it is commonly used to support the appearance of skin texture, even tone, and oil regulation. Your profile may indicate this ingredient is relevant if you have concerns around uneven tone or oiliness.",
            "aliases": ["Vitamin B3", "Nicotinamide"],
            "suitable_for": ["NORMAL", "OILY", "COMBINATION", "DRY", "SENSITIVE"],
            "caution_for": [],
            "avoid_for": [],
            "target_concerns": ["UNEVEN_TONE", "ACNE", "ENLARGED_PORES"],
            "is_active": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Retinol", "normalized_name": "retinol",
            "category": "RETINOIDS",
            "description": "A vitamin A derivative commonly used in anti-aging and skin-renewal skincare.",
            "common_uses": "Commonly used to support the appearance of fine lines, texture, and skin renewal.",
            "suitability_notes": "May be suitable for normal, oily, and combination skin. Use with caution on sensitive or dry skin.",
            "caution_notes": "May cause dryness, peeling, or irritation especially when starting out. Use sun protection during the day when using retinoids. Not suitable during pregnancy.",
            "education_content": "Retinol is a vitamin A derivative. It is one of the most studied ingredients in skincare, commonly used for skin renewal support. If your profile indicates concerns around texture or fine lines, this ingredient may be relevant. Start slowly and use sun protection.",
            "aliases": ["Vitamin A", "Retinoids"],
            "suitable_for": ["NORMAL", "OILY", "COMBINATION"],
            "caution_for": ["DRY", "SENSITIVE"],
            "avoid_for": [],
            "target_concerns": ["FINE_LINES", "TEXTURE", "HYPERPIGMENTATION"],
            "is_active": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Vitamin C", "normalized_name": "vitamin c",
            "category": "VITAMIN_C",
            "description": "An antioxidant ingredient used in skincare for brightening and protection.",
            "common_uses": "Commonly used to support the appearance of skin brightness, uneven tone, and to provide antioxidant support.",
            "suitability_notes": "May be suitable for most skin types. Sensitive skin may prefer gentler derivatives.",
            "caution_notes": "Some forms of Vitamin C (L-Ascorbic Acid at high concentrations) may cause tingling or irritation on sensitive skin. Store products carefully as Vitamin C can oxidise.",
            "education_content": "Vitamin C is an antioxidant ingredient. In skincare, it is commonly associated with supporting skin brightness and antioxidant protection. If your profile indicates concerns about uneven tone or dullness, Vitamin C may be relevant.",
            "aliases": ["Ascorbic Acid", "L-Ascorbic Acid", "Ascorbyl Glucoside"],
            "suitable_for": ["NORMAL", "DRY", "COMBINATION", "OILY"],
            "caution_for": ["SENSITIVE"],
            "avoid_for": [],
            "target_concerns": ["HYPERPIGMENTATION", "DULLNESS", "UNEVEN_TONE"],
            "is_active": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Hyaluronic Acid", "normalized_name": "hyaluronic acid",
            "category": "HYALURONIC_ACID",
            "description": "A humectant that draws moisture to the skin.",
            "common_uses": "Commonly used to support skin hydration and plumpness.",
            "suitability_notes": "Generally considered suitable for all skin types, including sensitive skin.",
            "caution_notes": "Apply to damp skin and follow with a moisturizer in dry climates to avoid drawing moisture from deeper skin layers.",
            "education_content": "Hyaluronic acid is a naturally occurring humectant. In skincare, it is commonly used to support hydration. If your profile indicates a concern around dryness or dehydration, hyaluronic acid is often a relevant ingredient.",
            "aliases": ["HA", "Sodium Hyaluronate"],
            "suitable_for": ["NORMAL", "DRY", "OILY", "COMBINATION", "SENSITIVE"],
            "caution_for": [],
            "avoid_for": [],
            "target_concerns": ["DRYNESS", "DEHYDRATION"],
            "is_active": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Salicylic Acid", "normalized_name": "salicylic acid",
            "category": "SALICYLIC_ACID",
            "description": "A beta-hydroxy acid (BHA) used in acne and oily skin care.",
            "common_uses": "Commonly used to support the appearance of acne, clogged pores, and excess oil.",
            "suitability_notes": "May be suitable for oily and acne-prone skin. Use with caution on dry or sensitive skin.",
            "caution_notes": "May cause dryness or irritation. Avoid if you have an aspirin allergy. Not recommended at high concentrations for sensitive or dry skin.",
            "education_content": "Salicylic acid is a BHA that can penetrate into pores. It is commonly used in products targeting acne and oiliness. If your profile indicates acne or clogged pore concerns, this ingredient may be relevant. Start with lower concentrations.",
            "aliases": ["BHA", "Beta-Hydroxy Acid"],
            "suitable_for": ["OILY", "COMBINATION"],
            "caution_for": ["DRY", "SENSITIVE"],
            "avoid_for": [],
            "target_concerns": ["ACNE", "ENLARGED_PORES", "OILINESS"],
            "is_active": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Ceramides", "normalized_name": "ceramides",
            "category": "CERAMIDES",
            "description": "Lipid molecules that are a natural component of the skin barrier.",
            "common_uses": "Commonly used to support skin barrier function, dryness, and sensitivity.",
            "suitability_notes": "Generally considered suitable for all skin types, especially dry and sensitive skin.",
            "caution_notes": "No common cautions. One of the most well-tolerated ingredient groups in skincare.",
            "education_content": "Ceramides are lipids naturally found in the skin. They play a role in the skin's barrier function. In skincare, ceramides are commonly used to support barrier health. If your profile indicates dryness or sensitivity, ceramides may be relevant.",
            "aliases": ["Ceramide NP", "Ceramide AP", "Ceramide EOP"],
            "suitable_for": ["NORMAL", "DRY", "OILY", "COMBINATION", "SENSITIVE"],
            "caution_for": [],
            "avoid_for": [],
            "target_concerns": ["DRYNESS", "SENSITIVITY", "ECZEMA"],
            "is_active": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Peptides", "normalized_name": "peptides",
            "category": "PEPTIDES",
            "description": "Short chains of amino acids used in skincare to support skin structure.",
            "common_uses": "Commonly used to support the appearance of skin firmness and fine lines.",
            "suitability_notes": "Generally suitable for all skin types.",
            "caution_notes": "No common cautions at typical skincare concentrations.",
            "education_content": "Peptides are short chains of amino acids. In skincare, they are commonly used to support the appearance of skin firmness. If your profile indicates concerns about fine lines or loss of firmness, peptides may be relevant.",
            "aliases": ["Palmitoyl Tripeptide", "Matrixyl", "Copper Peptides"],
            "suitable_for": ["NORMAL", "DRY", "OILY", "COMBINATION", "SENSITIVE"],
            "caution_for": [],
            "avoid_for": [],
            "target_concerns": ["FINE_LINES", "FIRMNESS"],
            "is_active": True,
        },
        {
            "id": _uuid.uuid4(), "name": "AHAs / BHAs", "normalized_name": "ahas bhas",
            "category": "AHAS_BHAS",
            "description": "Alpha-hydroxy acids (AHAs) and beta-hydroxy acids (BHAs) used for exfoliation.",
            "common_uses": "Commonly used to support skin exfoliation, texture improvement, and brightness.",
            "suitability_notes": "AHAs may be suitable for dry/normal skin; BHAs for oily/acne-prone skin. Sensitive skin may need lower concentrations.",
            "caution_notes": "Increases sun sensitivity — always use sun protection when using AHAs/BHAs. Avoid combining with high-concentration retinoids in the same routine step.",
            "education_content": "AHAs (such as glycolic and lactic acid) and BHAs (such as salicylic acid) are chemical exfoliants. They support skin cell turnover and texture. If your profile indicates concerns about texture, dullness, or acne, exfoliating acids may be relevant. Always use sun protection.",
            "aliases": ["Glycolic Acid", "Lactic Acid", "Mandelic Acid", "AHA", "Chemical Exfoliant"],
            "suitable_for": ["NORMAL", "OILY", "COMBINATION"],
            "caution_for": ["DRY", "SENSITIVE"],
            "avoid_for": [],
            "target_concerns": ["TEXTURE", "DULLNESS", "HYPERPIGMENTATION", "ACNE"],
            "is_active": True,
        },
    ])

    # ── 7. Seed: Products (28 representative entries across all 7 categories) ─
    products_table = sa.table(
        'products',
        sa.column('id', sa.Uuid()),
        sa.column('name', sa.String),
        sa.column('brand', sa.String),
        sa.column('category', sa.String),
        sa.column('description', sa.Text),
        sa.column('price', sa.Float),
        sa.column('currency', sa.String),
        sa.column('size', sa.String),
        sa.column('ingredients', sa.JSON),
        sa.column('active_ingredients', sa.JSON),
        sa.column('skin_types', sa.JSON),
        sa.column('target_concerns', sa.JSON),
        sa.column('sensitivity_flags', sa.JSON),
        sa.column('budget_band', sa.String),
        sa.column('is_available', sa.Boolean),
        sa.column('is_seed_data', sa.Boolean),
    )
    op.bulk_insert(products_table, [
        # ── FACE WASH ──
        {
            "id": _uuid.uuid4(), "name": "Gentle Hydrating Cleanser", "brand": "SkinBase",
            "category": "FACE_WASH", "description": "A mild, non-stripping cleanser suitable for daily use.",
            "price": 1249.0, "currency": "INR", "size": "150ml",
            "ingredients": ["water", "glycerin", "sodium cocoyl isethionate", "ceramides", "niacinamide"],
            "active_ingredients": ["ceramides", "niacinamide"],
            "skin_types": ["DRY", "NORMAL", "SENSITIVE"], "target_concerns": ["DRYNESS", "SENSITIVITY"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Balancing Foaming Cleanser", "brand": "ClearPore",
            "category": "FACE_WASH", "description": "A gentle foaming cleanser targeting excess oil and surface congestion.",
            "price": 1499.0, "currency": "INR", "size": "200ml",
            "ingredients": ["water", "salicylic acid", "niacinamide", "zinc gluconate", "glycerin"],
            "active_ingredients": ["salicylic acid", "niacinamide"],
            "skin_types": ["OILY", "COMBINATION"], "target_concerns": ["ACNE", "OILINESS", "ENLARGED_PORES"],
            "sensitivity_flags": ["salicylic acid"], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Calming Micellar Cleanser", "brand": "DermSoothe",
            "category": "FACE_WASH", "description": "A soap-free micellar water cleanser for sensitive skin.",
            "price": 1799.0, "currency": "INR", "size": "200ml",
            "ingredients": ["water", "glycerin", "poloxamer 184", "sodium chloride"],
            "active_ingredients": [],
            "skin_types": ["SENSITIVE", "DRY", "NORMAL"], "target_concerns": ["SENSITIVITY", "REDNESS"],
            "sensitivity_flags": [], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Brightening Vitamin C Cleanser", "brand": "LumiSkin",
            "category": "FACE_WASH", "description": "A vitamin C-enriched cleanser to support a bright complexion.",
            "price": 2299.0, "currency": "INR", "size": "150ml",
            "ingredients": ["water", "ascorbyl glucoside", "glycerin", "niacinamide", "aloe vera"],
            "active_ingredients": ["ascorbyl glucoside", "niacinamide"],
            "skin_types": ["NORMAL", "COMBINATION", "OILY"], "target_concerns": ["DULLNESS", "UNEVEN_TONE", "HYPERPIGMENTATION"],
            "sensitivity_flags": [], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        # ── MOISTURIZER ──
        {
            "id": _uuid.uuid4(), "name": "Hydrating Barrier Moisturizer", "brand": "CeraGlow",
            "category": "MOISTURIZER", "description": "A rich moisturizer with ceramides and hyaluronic acid to support skin barrier and hydration.",
            "price": 1399.0, "currency": "INR", "size": "60ml",
            "ingredients": ["water", "ceramides", "hyaluronic acid", "glycerin", "cholesterol", "fatty acids"],
            "active_ingredients": ["ceramides", "hyaluronic acid"],
            "skin_types": ["DRY", "NORMAL", "SENSITIVE"], "target_concerns": ["DRYNESS", "SENSITIVITY"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Oil-Free Gel Moisturizer", "brand": "AquaBalance",
            "category": "MOISTURIZER", "description": "A lightweight, oil-free gel moisturizer for oily and acne-prone skin.",
            "price": 1649.0, "currency": "INR", "size": "60ml",
            "ingredients": ["water", "glycerin", "niacinamide", "hyaluronic acid", "zinc"],
            "active_ingredients": ["niacinamide", "hyaluronic acid"],
            "skin_types": ["OILY", "COMBINATION"], "target_concerns": ["OILINESS", "ACNE", "ENLARGED_PORES"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Peptide-Infused Firming Moisturizer", "brand": "DermRestore",
            "category": "MOISTURIZER", "description": "A peptide-rich moisturizer to support skin firmness and fine lines.",
            "price": 3699.0, "currency": "INR", "size": "50ml",
            "ingredients": ["water", "palmitoyl tripeptide-5", "glycerin", "ceramides", "shea butter"],
            "active_ingredients": ["palmitoyl tripeptide-5", "ceramides"],
            "skin_types": ["NORMAL", "DRY", "COMBINATION"], "target_concerns": ["FINE_LINES", "FIRMNESS", "DRYNESS"],
            "sensitivity_flags": [], "budget_band": "PREMIUM", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Soothing Sensitive Moisturizer", "brand": "DermSoothe",
            "category": "MOISTURIZER", "description": "A fragrance-free moisturizer formulated for reactive and sensitive skin.",
            "price": 1949.0, "currency": "INR", "size": "50ml",
            "ingredients": ["water", "ceramides", "glycerin", "allantoin", "panthenol"],
            "active_ingredients": ["ceramides", "allantoin"],
            "skin_types": ["SENSITIVE", "DRY"], "target_concerns": ["SENSITIVITY", "REDNESS", "DRYNESS"],
            "sensitivity_flags": [], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        # ── SUNSCREEN ──
        {
            "id": _uuid.uuid4(), "name": "Broad Spectrum SPF 50 Sunscreen", "brand": "SunShield",
            "category": "SUNSCREEN", "description": "A lightweight SPF 50 sunscreen for daily protection.",
            "price": 1499.0, "currency": "INR", "size": "75ml",
            "ingredients": ["water", "zinc oxide", "titanium dioxide", "niacinamide", "glycerin"],
            "active_ingredients": ["zinc oxide", "titanium dioxide"],
            "skin_types": ["NORMAL", "DRY", "SENSITIVE"], "target_concerns": ["SUN_DAMAGE", "HYPERPIGMENTATION"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Oil-Control SPF 50+ Sunscreen", "brand": "MatteGuard",
            "category": "SUNSCREEN", "description": "Mattifying SPF 50+ sunscreen for oily and acne-prone skin.",
            "price": 1799.0, "currency": "INR", "size": "60ml",
            "ingredients": ["water", "zinc oxide", "niacinamide", "silica", "dimethicone"],
            "active_ingredients": ["zinc oxide", "niacinamide"],
            "skin_types": ["OILY", "COMBINATION"], "target_concerns": ["OILINESS", "SUN_DAMAGE"],
            "sensitivity_flags": [], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Tinted Mineral Sunscreen SPF 40", "brand": "LumiSkin",
            "category": "SUNSCREEN", "description": "A tinted mineral SPF 40 that evens skin tone while protecting.",
            "price": 3099.0, "currency": "INR", "size": "40ml",
            "ingredients": ["water", "zinc oxide", "iron oxides", "hyaluronic acid", "niacinamide"],
            "active_ingredients": ["zinc oxide", "iron oxides"],
            "skin_types": ["NORMAL", "DRY", "COMBINATION"], "target_concerns": ["HYPERPIGMENTATION", "SUN_DAMAGE", "UNEVEN_TONE"],
            "sensitivity_flags": [], "budget_band": "PREMIUM", "is_available": True, "is_seed_data": True,
        },
        # ── SERUM ──
        {
            "id": _uuid.uuid4(), "name": "Niacinamide 10% + Zinc 1% Serum", "brand": "TheOrdinary",
            "category": "SERUM", "description": "A targeted serum addressing visible sebum, shine, and blemishes.",
            "price": 749.0, "currency": "INR", "size": "30ml",
            "ingredients": ["water", "niacinamide", "zinc gluconate", "glycerin"],
            "active_ingredients": ["niacinamide", "zinc gluconate"],
            "skin_types": ["OILY", "COMBINATION", "NORMAL"], "target_concerns": ["ACNE", "OILINESS", "ENLARGED_PORES"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Vitamin C 15% Brightening Serum", "brand": "LumiSkin",
            "category": "SERUM", "description": "A stable Vitamin C serum to support even skin tone and brightness.",
            "price": 2599.0, "currency": "INR", "size": "30ml",
            "ingredients": ["water", "l-ascorbic acid", "vitamin e", "ferulic acid", "glycerin"],
            "active_ingredients": ["l-ascorbic acid", "vitamin e", "ferulic acid"],
            "skin_types": ["NORMAL", "COMBINATION", "OILY"], "target_concerns": ["HYPERPIGMENTATION", "DULLNESS", "UNEVEN_TONE"],
            "sensitivity_flags": ["l-ascorbic acid"], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Hyaluronic Acid 2% + B5 Serum", "brand": "TheOrdinary",
            "category": "SERUM", "description": "A hydration booster serum with multiple weights of hyaluronic acid.",
            "price": 799.0, "currency": "INR", "size": "30ml",
            "ingredients": ["water", "sodium hyaluronate", "panthenol", "glycerin"],
            "active_ingredients": ["sodium hyaluronate", "panthenol"],
            "skin_types": ["DRY", "NORMAL", "COMBINATION", "SENSITIVE"], "target_concerns": ["DRYNESS", "DEHYDRATION"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Retinol 0.5% Renewal Serum", "brand": "DermRestore",
            "category": "SERUM", "description": "A mid-strength retinol serum to support skin texture and renewal.",
            "price": 2149.0, "currency": "INR", "size": "30ml",
            "ingredients": ["water", "retinol", "squalane", "glycerin", "vitamin e"],
            "active_ingredients": ["retinol"],
            "skin_types": ["NORMAL", "COMBINATION", "OILY"], "target_concerns": ["FINE_LINES", "TEXTURE", "HYPERPIGMENTATION"],
            "sensitivity_flags": ["retinol"], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Multi-Peptide Firming Serum", "brand": "SkinBase",
            "category": "SERUM", "description": "A peptide-complex serum targeting skin firmness and elasticity.",
            "price": 3949.0, "currency": "INR", "size": "30ml",
            "ingredients": ["water", "palmitoyl tripeptide-38", "acetyl hexapeptide-8", "hyaluronic acid", "glycerin"],
            "active_ingredients": ["palmitoyl tripeptide-38", "acetyl hexapeptide-8"],
            "skin_types": ["NORMAL", "DRY", "COMBINATION"], "target_concerns": ["FINE_LINES", "FIRMNESS"],
            "sensitivity_flags": [], "budget_band": "PREMIUM", "is_available": True, "is_seed_data": True,
        },
        # ── TONER ──
        {
            "id": _uuid.uuid4(), "name": "Hydrating Toner with Hyaluronic Acid", "brand": "AquaBalance",
            "category": "TONER", "description": "A watery hydrating toner to prep skin for serums.",
            "price": 1149.0, "currency": "INR", "size": "200ml",
            "ingredients": ["water", "sodium hyaluronate", "glycerin", "aloe vera", "panthenol"],
            "active_ingredients": ["sodium hyaluronate"],
            "skin_types": ["DRY", "NORMAL", "SENSITIVE", "COMBINATION"], "target_concerns": ["DRYNESS", "DEHYDRATION"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "BHA Pore-Minimizing Toner", "brand": "ClearPore",
            "category": "TONER", "description": "A BHA-containing toner to support pore appearance and oiliness.",
            "price": 1799.0, "currency": "INR", "size": "150ml",
            "ingredients": ["water", "salicylic acid", "niacinamide", "witch hazel", "glycerin"],
            "active_ingredients": ["salicylic acid", "niacinamide"],
            "skin_types": ["OILY", "COMBINATION"], "target_concerns": ["ENLARGED_PORES", "ACNE", "OILINESS"],
            "sensitivity_flags": ["salicylic acid", "witch hazel"], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Brightening AHA Toner", "brand": "LumiSkin",
            "category": "TONER", "description": "A gentle AHA toner to support skin brightness and texture.",
            "price": 2299.0, "currency": "INR", "size": "150ml",
            "ingredients": ["water", "glycolic acid", "lactic acid", "aloe vera", "panthenol"],
            "active_ingredients": ["glycolic acid", "lactic acid"],
            "skin_types": ["NORMAL", "COMBINATION", "OILY"], "target_concerns": ["DULLNESS", "TEXTURE", "UNEVEN_TONE"],
            "sensitivity_flags": ["glycolic acid", "lactic acid"], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        # ── TREATMENT PRODUCTS ──
        {
            "id": _uuid.uuid4(), "name": "Spot Treatment Gel (2% Salicylic Acid)", "brand": "ClearPore",
            "category": "TREATMENT", "description": "A targeted spot treatment for active blemishes.",
            "price": 999.0, "currency": "INR", "size": "15ml",
            "ingredients": ["water", "salicylic acid", "niacinamide", "zinc"],
            "active_ingredients": ["salicylic acid"],
            "skin_types": ["OILY", "COMBINATION", "NORMAL"], "target_concerns": ["ACNE"],
            "sensitivity_flags": ["salicylic acid"], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Dark Spot Corrector Serum", "brand": "LumiSkin",
            "category": "TREATMENT", "description": "A targeted treatment serum for hyperpigmentation and dark spots.",
            "price": 3449.0, "currency": "INR", "size": "30ml",
            "ingredients": ["water", "tranexamic acid", "niacinamide", "kojic acid", "vitamin c"],
            "active_ingredients": ["tranexamic acid", "niacinamide", "kojic acid"],
            "skin_types": ["NORMAL", "COMBINATION", "DRY"], "target_concerns": ["HYPERPIGMENTATION", "UNEVEN_TONE"],
            "sensitivity_flags": [], "budget_band": "PREMIUM", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Barrier Repair Ampoule", "brand": "DermSoothe",
            "category": "TREATMENT", "description": "An intensive barrier repair treatment for disrupted or sensitive skin.",
            "price": 2849.0, "currency": "INR", "size": "20ml",
            "ingredients": ["water", "ceramides", "cholesterol", "fatty acids", "centella asiatica"],
            "active_ingredients": ["ceramides", "centella asiatica"],
            "skin_types": ["SENSITIVE", "DRY"], "target_concerns": ["SENSITIVITY", "REDNESS", "DRYNESS"],
            "sensitivity_flags": [], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        # ── FACE MASKS ──
        {
            "id": _uuid.uuid4(), "name": "Hydrating Sheet Mask with Hyaluronic Acid", "brand": "AquaBalance",
            "category": "FACE_MASK", "description": "An intense weekly hydration sheet mask.",
            "price": 649.0, "currency": "INR", "size": "25ml (single)",
            "ingredients": ["water", "sodium hyaluronate", "glycerin", "panthenol", "aloe vera"],
            "active_ingredients": ["sodium hyaluronate"],
            "skin_types": ["DRY", "NORMAL", "SENSITIVE", "COMBINATION"], "target_concerns": ["DRYNESS", "DEHYDRATION"],
            "sensitivity_flags": [], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Purifying Clay Mask", "brand": "ClearPore",
            "category": "FACE_MASK", "description": "A weekly clay mask to draw out impurities and minimize pores.",
            "price": 1299.0, "currency": "INR", "size": "75ml",
            "ingredients": ["kaolin clay", "bentonite clay", "salicylic acid", "niacinamide", "charcoal"],
            "active_ingredients": ["kaolin clay", "salicylic acid"],
            "skin_types": ["OILY", "COMBINATION"], "target_concerns": ["ACNE", "ENLARGED_PORES", "OILINESS"],
            "sensitivity_flags": ["salicylic acid"], "budget_band": "BUDGET", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Brightening Vitamin C Sleeping Mask", "brand": "LumiSkin",
            "category": "FACE_MASK", "description": "An overnight sleeping mask to support skin brightness.",
            "price": 2449.0, "currency": "INR", "size": "60ml",
            "ingredients": ["water", "ascorbyl glucoside", "niacinamide", "glycerin", "squalane"],
            "active_ingredients": ["ascorbyl glucoside", "niacinamide"],
            "skin_types": ["NORMAL", "COMBINATION", "DRY"], "target_concerns": ["DULLNESS", "UNEVEN_TONE"],
            "sensitivity_flags": [], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "Calming Centella Mask", "brand": "DermSoothe",
            "category": "FACE_MASK", "description": "A soothing mask for reactive and red-prone skin.",
            "price": 1799.0, "currency": "INR", "size": "50ml",
            "ingredients": ["water", "centella asiatica", "ceramides", "allantoin", "glycerin"],
            "active_ingredients": ["centella asiatica", "ceramides"],
            "skin_types": ["SENSITIVE", "DRY", "NORMAL"], "target_concerns": ["REDNESS", "SENSITIVITY"],
            "sensitivity_flags": [], "budget_band": "MODERATE", "is_available": True, "is_seed_data": True,
        },
        {
            "id": _uuid.uuid4(), "name": "AHA Exfoliating Sleep Mask", "brand": "LumiSkin",
            "category": "FACE_MASK", "description": "An overnight exfoliating mask for texture and brightness.",
            "price": 2949.0, "currency": "INR", "size": "50ml",
            "ingredients": ["water", "glycolic acid", "lactic acid", "hyaluronic acid", "niacinamide"],
            "active_ingredients": ["glycolic acid", "lactic acid"],
            "skin_types": ["NORMAL", "COMBINATION"], "target_concerns": ["TEXTURE", "DULLNESS", "HYPERPIGMENTATION"],
            "sensitivity_flags": ["glycolic acid", "lactic acid"], "budget_band": "PREMIUM", "is_available": True, "is_seed_data": True,
        },
    ])

    # ── 8. Seed: Ingredient Interactions ──────────────────────────────────────
    # NOTE: We cannot seed interactions here because ingredient IDs are generated UUIDs.
    # Interactions are seeded by the ingredient_service on first startup if tables are empty.


def downgrade() -> None:
    op.drop_table('progress_snapshots')
    op.drop_table('product_recommendations')
    op.drop_table('products')
    op.drop_table('ingredient_interactions')
    op.drop_table('ingredients')
