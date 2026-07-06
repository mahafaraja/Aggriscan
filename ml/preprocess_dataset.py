import os
import argparse
import shutil
from pathlib import Path

# Define the crop mapping from PlantVillage format to Agriscan format
CROP_MAPPING = {
    # Banana diseases
    'Banana___Bacterial_Wilt': 'banana',
    'Banana___Black_Sigatoka': 'banana',
    'Banana___Healthy': 'banana',
    
    # Bean diseases
    'Bean___Angular_Leaf_Spot': 'bean',
    'Bean___Bean_Rust': 'bean',
    'Bean___Healthy': 'bean',
    
    # Cassava diseases
    'Cassava___Bacterial_Blight': 'cassava',
    'Cassava___Brown_Spot': 'cassava',
    'Cassava___Green_Mottle': 'cassava',
    'Cassava___Mosaic': 'cassava',
    'Cassava___Healthy': 'cassava',
    
    # Coffee diseases
    'Coffee___Rust': 'coffee',
    'Coffee___Healthy': 'coffee',
    
    # Corn/Maize diseases
    'Corn___Common_Rust': 'corn',
    'Corn___Gray_Leaf_Spot': 'corn',
    'Corn___Northern_Leaf_Blight': 'corn',
    'Corn___Healthy': 'corn',
    
    # Groundnut/Peanut diseases
    'Groundnut___Early_Leaf_Spot': 'groundnuts',
    'Groundnut___Late_Leaf_Spot': 'groundnuts',
    'Groundnut___Healthy': 'groundnuts',
    
    # Potato diseases
    'Potato___Early_Blight': 'potato',
    'Potato___Late_Blight': 'potato',
    'Potato___Healthy': 'potato',
    
    # Tomato diseases
    'Tomato___Bacterial_Spot': 'tomato',
    'Tomato___Early_Blight': 'tomato',
    'Tomato___Late_Blight': 'tomato',
    'Tomato___Leaf_Mold': 'tomato',
    'Tomato___Septoria_Leaf_Spot': 'tomato',
    'Tomato___Spider_Mites': 'tomato',
    'Tomato___Target_Spot': 'tomato',
    'Tomato___Yellow_Leaf_Curl_Virus': 'tomato',
    'Tomato___Mosaic_Virus': 'tomato',
    'Tomato___Healthy': 'tomato',
}

# Disease severity mapping
DISEASE_SEVERITY = {
    'Bacterial_Wilt': 'High',
    'Black_Sigatoka': 'High',
    'Angular_Leaf_Spot': 'Medium',
    'Bean_Rust': 'Medium',
    'Bacterial_Blight': 'High',
    'Brown_Spot': 'Medium',
    'Green_Mottle': 'Medium',
    'Mosaic': 'High',
    'Rust': 'High',
    'Common_Rust': 'Medium',
    'Gray_Leaf_Spot': 'Medium',
    'Northern_Leaf_Blight': 'High',
    'Early_Leaf_Spot': 'Medium',
    'Late_Leaf_Spot': 'High',
    'Early_Blight': 'Medium',
    'Late_Blight': 'High',
    'Bacterial_Spot': 'High',
    'Leaf_Mold': 'Medium',
    'Septoria_Leaf_Spot': 'Medium',
    'Spider_Mites': 'Medium',
    'Target_Spot': 'Medium',
    'Yellow_Leaf_Curl_Virus': 'High',
    'Mosaic_Virus': 'High',
}

def get_disease_label(plantvillage_label):
    """
    Convert PlantVillage label to Agriscan format
    Example: 'Cassava___Mosaic' -> 'Cassava_CMD'
    """
    parts = plantvillage_label.split('___')
    if len(parts) != 2:
        return plantvillage_label
    
    crop, disease = parts
    
    # Map crop names
    crop_map = {
        'Banana': 'Banana',
        'Bean': 'Bean',
        'Cassava': 'Cassava',
        'Coffee': 'Coffee',
        'Corn': 'Corn',
        'Groundnut': 'Groundnuts',
        'Potato': 'Potato',
        'Tomato': 'Tomato'
    }
    
    crop_name = crop_map.get(crop, crop)
    
    # If healthy, return healthy label
    if disease == 'Healthy':
        return f"{crop_name}_Healthy"
    
    # Map disease names to Agriscan format
    disease_map = {
        'Bacterial_Wilt': 'BBW',
        'Black_Sigatoka': 'BS',
        'Angular_Leaf_Spot': 'Angular_Leaf_Spot',
        'Bean_Rust': 'Rust',
        'Bacterial_Blight': 'Bacterial_Blight',
        'Brown_Spot': 'Brown_Spot',
        'Green_Mottle': 'Green_Mottle',
        'Mosaic': 'CMD',
        'Rust': 'Leaf_Rust',
        'Common_Rust': 'Common_Rust',
        'Gray_Leaf_Spot': 'Gray_Leaf_Spot',
        'Northern_Leaf_Blight': 'Northern_Leaf_Blight',
        'Early_Leaf_Spot': 'Early_Leaf_Spot',
        'Late_Leaf_Spot': 'Late_Leaf_Spot',
        'Early_Blight': 'Early_Blight',
        'Late_Blight': 'Late_Blight',
        'Bacterial_Spot': 'Bacterial_Spot',
        'Leaf_Mold': 'Leaf_Mold',
        'Septoria_Leaf_Spot': 'Septoria_Leaf_Spot',
        'Spider_Mites': 'Spider_Mites',
        'Target_Spot': 'Target_Spot',
        'Yellow_Leaf_Curl_Virus': 'YLCV',
        'Mosaic_Virus': 'Mosaic',
    }
    
    disease_code = disease_map.get(disease, disease)
    return f"{crop_name}_{disease_code}"

def preprocess_dataset(input_dir, output_dir, target_crops=None):
    """
    Preprocess PlantVillage dataset for Agriscan
    """
    print(f"Preprocessing dataset from {input_dir} to {output_dir}")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Track statistics
    stats = {}
    
    # Walk through input directory
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if not file.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            
            # Get PlantVillage class name from directory structure
            plantvillage_class = os.path.basename(root)
            
            # Map to Agriscan crop
            if plantvillage_class not in CROP_MAPPING:
                print(f"Warning: Unknown class {plantvillage_class}, skipping...")
                continue
            
            crop = CROP_MAPPING[plantvillage_class]
            
            # Filter by target crops if specified
            if target_crops and crop not in target_crops:
                continue
            
            # Create Agriscan label
            agriscan_label = get_disease_label(plantvillage_class)
            
            # Create output directory
            output_class_dir = os.path.join(output_dir, agriscan_label)
            os.makedirs(output_class_dir, exist_ok=True)
            
            # Copy file
            src = os.path.join(root, file)
            dst = os.path.join(output_class_dir, file)
            shutil.copy2(src, dst)
            
            # Update stats
            if agriscan_label not in stats:
                stats[agriscan_label] = 0
            stats[agriscan_label] += 1
    
    # Print statistics
    print("\nDataset statistics:")
    print(f"Total classes: {len(stats)}")
    print(f"Total images: {sum(stats.values())}")
    print("\nClass distribution:")
    for label, count in sorted(stats.items()):
        print(f"  {label}: {count} images")
    
    # Save class map
    class_map = {str(i): label for i, label in enumerate(sorted(stats.keys()))}
    class_map_path = os.path.join(output_dir, 'class_map.json')
    with open(class_map_path, 'w') as f:
        json.dump(class_map, f, indent=2)
    print(f"\nClass map saved to: {class_map_path}")
    
    return stats

def main():
    parser = argparse.ArgumentParser(description="Preprocess PlantVillage dataset for Agriscan")
    parser.add_argument("--input_dir", type=str, required=True, help="Path to PlantVillage dataset")
    parser.add_argument("--output_dir", type=str, default="./dataset", help="Output directory for processed dataset")
    parser.add_argument("--crops", nargs='+', help="Target crops (e.g., banana cassava coffee)")
    args = parser.parse_args()
    
    # Validate input directory
    if not os.path.exists(args.input_dir):
        print(f"ERROR: Input directory not found: {args.input_dir}")
        return
    
    # Preprocess dataset
    stats = preprocess_dataset(args.input_dir, args.output_dir, args.crops)
    
    print("\nPreprocessing complete!")
    print(f"Processed dataset saved to: {args.output_dir}")
    print("\nNext steps:")
    print("1. Review the class distribution above")
    print("2. Run training: python ml/train_transfer_learning.py --data_dir ./dataset")

if __name__ == "__main__":
    main()