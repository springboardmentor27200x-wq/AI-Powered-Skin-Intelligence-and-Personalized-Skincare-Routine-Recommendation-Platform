import pandas as pd
import numpy as np
import random
import os

def generate_dataset(num_samples=10000):
    np.random.seed(42)
    random.seed(42)

    skin_types = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal']
    age_groups = ['under 18', '18-24', '25-34', '35-44', '45-54', '55+']
    uv_levels = ['Low', 'Moderate', 'High']
    stress_levels = ['Low', 'Medium', 'High']

    data = []

    for _ in range(num_samples):
        # Profile Data
        skin_type = random.choice(skin_types)
        age = random.choice(age_groups)
        
        # Lifestyle Data
        sleep = np.random.normal(loc=7.0, scale=1.5)
        sleep = max(3.0, min(sleep, 10.0))
        
        water = np.random.normal(loc=2000, scale=500)
        water = max(500, min(water, 4000))
        
        sunscreen = random.randint(0, 100)
        uv = random.choice(uv_levels)
        stress = random.choice(stress_levels)

        # Generate target variables (simulated ground truth)
        score = 90.0

        # Adjust score and create concerns based on deterministic logic to create a meaningful dataset
        has_acne = 0
        has_dry = 0
        has_wrinkles = 0
        has_dark_spots = 0

        # Acne
        if skin_type == 'Oily' or stress == 'High' or age in ['under 18', '18-24']:
            if random.random() > 0.3:
                has_acne = 1
                score -= random.uniform(5, 15)

        # Dry Skin
        if skin_type == 'Dry' or water < 1500:
            if random.random() > 0.3:
                has_dry = 1
                score -= random.uniform(5, 15)

        # Wrinkles / Aging
        if age in ['45-54', '55+'] or (uv == 'High' and sunscreen < 50):
            if random.random() > 0.2:
                has_wrinkles = 1
                score -= random.uniform(5, 20)

        # Dark Spots / Hyperpigmentation
        if (uv == 'High' and sunscreen < 40) or sleep < 6:
            if random.random() > 0.4:
                has_dark_spots = 1
                score -= random.uniform(5, 10)

        score = max(20.0, min(score, 100.0))

        data.append({
            'skin_type': skin_type,
            'age_group': age,
            'avg_sleep': sleep,
            'avg_water': water,
            'sunscreen_rate': sunscreen,
            'avg_uv': uv,
            'avg_stress': stress,
            'health_score': score,
            'concern_acne': has_acne,
            'concern_dry_skin': has_dry,
            'concern_wrinkles': has_wrinkles,
            'concern_dark_spots': has_dark_spots
        })

    df = pd.DataFrame(data)
    
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    out_path = os.path.join(os.path.dirname(__file__), 'synthetic_skincare_data.csv')
    df.to_csv(out_path, index=False)
    print(f"Generated {num_samples} samples at {out_path}")

if __name__ == '__main__':
    generate_dataset()
