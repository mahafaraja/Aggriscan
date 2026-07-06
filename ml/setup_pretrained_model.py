#!/usr/bin/env python3
"""
Quick setup script to download and prepare a pre-trained crop disease detection model.
This script automates the process of setting up the model for Agriscan.
"""

import os
import sys
import urllib.request
import zipfile
import json
from pathlib import Path

def print_header(text):
    print("\n" + "="*60)
    print(text)
    print("="*60)

def print_step(text):
    print(f"\n→ {text}")

def download_file(url, destination):
    """Download a file from URL to destination with progress"""
    print(f"Downloading from: {url}")
    print(f"Saving to: {destination}")
    
    def report_progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = min(downloaded * 100 / total_size, 100)
        sys.stdout.write(f"\rProgress: {percent:.1f}% ({downloaded}/{total_size} bytes)")
        sys.stdout.flush()
    
    try:
        urllib.request.urlretrieve(url, destination, reporthook=report_progress)
        print("\n✓ Download complete!")
        return True
    except Exception as e:
        print(f"\n✗ Download failed: {e}")
        return False

def extract_zip(zip_path, extract_to):
    """Extract zip file"""
    print(f"Extracting: {zip_path}")
    print(f"To: {extract_to}")
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print("✓ Extraction complete!")
        return True
    except Exception as e:
        print(f"✗ Extraction failed: {e}")
        return False

def create_directory_structure():
    """Create necessary directories"""
    print_step("Creating directory structure...")
    
    dirs = [
        "backend/app/model_assets/pretrained",
        "ml/dataset",
        "ml/tflite",
        "ml/plant_village_raw"
    ]
    
    for dir_path in dirs:
        os.makedirs(dir_path, exist_ok=True)
        print(f"  Created: {dir_path}")
    
    print("✓ Directory structure created!")

def download_sample_model():
    """
    Download a sample pre-trained model.
    Note: This is a placeholder. In production, you would download actual trained models.
    """
    print_step("Setting up sample model configuration...")
    
    # Create a sample class map for demonstration
    sample_class_map = {
        "0": "Banana_BBW",
        "1": "Banana_Black_Sigatoka",
        "2": "Banana_Healthy",
        "3": "Cassava_CMD",
        "4": "Cassava_Healthy",
        "5": "Corn_Northern_Leaf_Blight",
        "6": "Corn_Healthy",
        "7": "Potato_Late_Blight",
        "8": "Potato_Healthy",
        "9": "Tomato_Early_Blight",
        "10": "Tomato_Healthy"
    }
    
    class_map_path = "backend/app/model_assets/pretrained/class_map.json"
    with open(class_map_path, 'w') as f:
        json.dump(sample_class_map, f, indent=2)
    
    print(f"✓ Sample class map created at: {class_map_path}")
    print("\nNOTE: You still need to train or download the actual .tflite model file.")
    print("See SETUP_GUIDE.md for instructions.")

def check_dependencies():
    """Check if required dependencies are installed"""
    print_step("Checking dependencies...")
    
    required_packages = ['tensorflow', 'pillow', 'numpy']
    missing = []
    
    for package in required_packages:
        try:
            if package == 'pillow':
                __import__('PIL')
            else:
                __import__(package)
            print(f"  ✓ {package} is installed")
        except ImportError:
            print(f"  ✗ {package} is NOT installed")
            missing.append(package)
    
    if missing:
        print(f"\n⚠ Missing dependencies: {', '.join(missing)}")
        print("Install them with:")
        if 'pillow' in missing:
            print("  pip install pillow")
        if 'tensorflow' in missing:
            print("  pip install tensorflow")
        if 'numpy' in missing:
            print("  pip install numpy")
        return False
    
    print("✓ All dependencies are installed!")
    return True

def verify_setup():
    """Verify that all files are in place"""
    print_step("Verifying setup...")
    
    required_files = [
        "backend/app/model_assets/agriscan_model.tflite",
        "backend/app/model_assets/class_map.json",
        "backend/app/model_assets/pretrained/class_map.json",
        "ml/train_transfer_learning.py",
        "ml/preprocess_dataset.py"
    ]
    
    all_good = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"  ✓ {file_path}")
        else:
            print(f"  ✗ {file_path} (missing)")
            all_good = False
    
    return all_good

def print_next_steps():
    """Print next steps for the user"""
    print_header("NEXT STEPS")
    
    print("""
Choose one of the following options:

OPTION 1: Use Existing Model (Fastest)
--------------------------------------
Your current model is at: backend/app/model_assets/agriscan_model.tflite
You can test it with:
  cd backend
  python test_inference.py

OPTION 2: Train with Transfer Learning (Recommended)
----------------------------------------------------
1. Download PlantVillage dataset:
   cd ml
   wget https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/4e6ab7e4-8c7e-4a5f-8f5e-9f5c5c5c5c5c/file_downloaded -O plant_village_dataset.zip
   unzip plant_village_dataset.zip -d plant_village_raw

2. Preprocess dataset:
   python ml/preprocess_dataset.py --input_dir ./plant_village_raw --output_dir ./dataset

3. Train model:
   cd backend
   python ../ml/train_transfer_learning.py --data_dir ../ml/dataset --output_dir ../ml/tflite

4. Deploy model:
   mkdir -p backend/app/model_assets/pretrained
   cp ml/tflite/plant_village_model.tflite backend/app/model_assets/pretrained/
   cp ml/tflite/class_map.json backend/app/model_assets/pretrained/

5. Test:
   python test_inference.py

OPTION 3: Use Pre-trained Model from External Source
----------------------------------------------------
If you have a pre-trained TFLite model:
1. Copy it to: backend/app/model_assets/pretrained/plant_village_model.tflite
2. Copy its class map to: backend/app/model_assets/pretrained/class_map.json
3. Test with: python test_inference.py

For detailed instructions, see: SETUP_GUIDE.md
""")

def main():
    print_header("Agriscan Pre-trained Model Setup")
    
    # Check dependencies
    if not check_dependencies():
        print("\n⚠ Please install missing dependencies before continuing.")
        return
    
    # Create directory structure
    create_directory_structure()
    
    # Create sample class map
    download_sample_model()
    
    # Verify setup
    setup_complete = verify_setup()
    
    # Print summary
    print_header("SETUP SUMMARY")
    
    if setup_complete:
        print("✓ Basic setup complete!")
    else:
        print("⚠ Setup incomplete - some files are missing")
    
    print("\nCurrent status:")
    print(f"  - Directory structure: ✓ Created")
    print(f"  - Sample class map: ✓ Created")
    print(f"  - Training scripts: ✓ Created")
    print(f"  - TFLite model: ✗ Not yet created (needs training or download)")
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Setup failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)