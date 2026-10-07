import pandas as pd
import numpy as np
import os

def generate_realistic_data(num_samples=10000):
    np.random.seed(42)
    
    # 1. Base Profiles
    skin_types = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive']
    age_groups = ['18-24', '25-34', '35-44', '45-54', '55+']
    
    data = {
        'skin_type': np.random.choice(skin_types, num_samples, p=[0.2, 0.3, 0.2, 0.2, 0.1]),
        'age_group': np.random.choice(age_groups, num_samples, p=[0.25, 0.35, 0.2, 0.15, 0.05])
    }
    df = pd.DataFrame(data)
    
    # 2. Lifestyle Factors
    # Age influences sleep and stress
    df['avg_sleep'] = np.random.normal(7, 1.5, num_samples)
    df.loc[df['age_group'] == '25-34', 'avg_sleep'] -= 0.5  # young professionals sleep less
    df['avg_sleep'] = np.clip(df['avg_sleep'], 3, 10)
    
    df['avg_stress'] = np.random.choice(['Low', 'Medium', 'High'], num_samples, p=[0.3, 0.5, 0.2])
    
    df['avg_water'] = np.random.normal(2000, 500, num_samples)
    df['avg_water'] = np.clip(df['avg_water'], 500, 4000)
    
    df['avg_uv'] = np.random.choice(['Low', 'Moderate', 'High', 'Extreme'], num_samples, p=[0.3, 0.4, 0.2, 0.1])
    
    # Sunscreen usage (better in older groups or sensitive skin)
    df['sunscreen_rate'] = np.random.normal(50, 25, num_samples)
    df.loc[df['skin_type'] == 'Sensitive', 'sunscreen_rate'] += 15
    df.loc[df['age_group'].isin(['35-44', '45-54']), 'sunscreen_rate'] += 10
    df['sunscreen_rate'] = np.clip(df['sunscreen_rate'], 0, 100)

    # 3. Generating Correlated Concerns (The realistic part)
    # Acne: higher in oily skin, high stress, young age, poor sleep
    acne_prob = np.zeros(num_samples)
    acne_prob += (df['skin_type'] == 'Oily') * 0.4
    acne_prob += (df['skin_type'] == 'Combination') * 0.2
    acne_prob += (df['age_group'].isin(['18-24', '25-34'])) * 0.3
    acne_prob += (df['avg_stress'] == 'High') * 0.2
    acne_prob -= (df['avg_sleep'] > 7) * 0.1
    df['concern_acne'] = (np.random.rand(num_samples) < acne_prob).astype(int)

    # Dry Skin: higher in dry skin type, low water, older age
    dry_prob = np.zeros(num_samples)
    dry_prob += (df['skin_type'] == 'Dry') * 0.6
    dry_prob += (df['avg_water'] < 1500) * 0.2
    dry_prob += (df['age_group'].isin(['45-54', '55+'])) * 0.3
    df['concern_dry_skin'] = (np.random.rand(num_samples) < dry_prob).astype(int)

    # Wrinkles: heavily tied to age and UV exposure without sunscreen
    wrinkle_prob = np.zeros(num_samples)
    wrinkle_prob += (df['age_group'] == '35-44') * 0.3
    wrinkle_prob += (df['age_group'] == '45-54') * 0.6
    wrinkle_prob += (df['age_group'] == '55+') * 0.9
    wrinkle_prob += (df['avg_uv'].isin(['High', 'Extreme']) & (df['sunscreen_rate'] < 50)) * 0.3
    df['concern_wrinkles'] = (np.random.rand(num_samples) < wrinkle_prob).astype(int)

    # Dark Spots: tied to UV, age, and acne scarring (if acne is present)
    spots_prob = np.zeros(num_samples)
    spots_prob += (df['avg_uv'].isin(['High', 'Extreme']) & (df['sunscreen_rate'] < 50)) * 0.5
    spots_prob += (df['concern_acne'] == 1) * 0.3
    spots_prob += (df['age_group'].isin(['45-54', '55+'])) * 0.4
    df['concern_dark_spots'] = (np.random.rand(num_samples) < spots_prob).astype(int)

    # 4. Calculate a highly accurate Health Score (0-100)
    # Start at 100, deduct based on bad habits and concerns
    score = np.full(num_samples, 90.0)
    score -= (df['concern_acne'] * 10)
    score -= (df['concern_dry_skin'] * 8)
    score -= (df['concern_wrinkles'] * 8)
    score -= (df['concern_dark_spots'] * 7)
    
    # Add/subtract for lifestyle
    score += ((df['avg_sleep'] - 7) * 2) # + points for good sleep
    score += ((df['avg_water'] - 2000) / 500) # + points for water
    score -= (df['avg_stress'] == 'High') * 5
    score -= (df['avg_stress'] == 'Medium') * 2
    score += (df['sunscreen_rate'] / 10) # max +10 for sunscreen

    df['health_score'] = np.clip(score, 30, 100).round(1)

    # Save to CSV
    output_path = os.path.join(os.path.dirname(__file__), 'realistic_skincare_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} realistic samples at {output_path}")

if __name__ == '__main__':
    generate_realistic_data()
