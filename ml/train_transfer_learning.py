import os
import argparse
import json
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks

def build_transfer_learning_model(input_shape=(224, 224, 3), num_classes=8):
    """
    Uses MobileNetV2 pre-trained on ImageNet for transfer learning
    """
    print("Building transfer learning model with MobileNetV2...")
    
    # Load pre-trained MobileNetV2 (exclude top classification layer)
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        weights='imagenet',
        include_top=False,
        pooling='avg'
    )
    
    # Freeze base model layers initially
    base_model.trainable = False
    
    # Add custom classification head
    inputs = tf.keras.Input(shape=input_shape)
    
    # Preprocess input (MobileNetV2 expects [0, 255] range)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    
    # Base model
    x = base_model(x, training=False)
    
    # Custom classifier
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = models.Model(inputs, outputs, name="PlantVillage_Transfer_Learning")
    
    return model, base_model

def convert_to_tflite_optimized(model, output_path):
    """
    Convert model to TFLite with optimizations
    """
    print("Converting to TFLite with Float16 quantization...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    
    tflite_model = converter.convert()
    
    with open(output_path, 'wb') as f:
        f.write(tflite_model)
    
    print(f"TFLite model saved to: {output_path}")
    print(f"Model size: {len(tflite_model) / (1024*1024):.2f} MB")

def main():
    parser = argparse.ArgumentParser(description="Transfer Learning Training for Crop Disease Detection")
    parser.add_argument("--data_dir", type=str, default="./dataset", help="Path to image dataset directory")
    parser.add_argument("--output_dir", type=str, default="./tflite", help="Directory to save TFLite models")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--fine_tune", action="store_true", help="Fine-tune the base model after initial training")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size for training")
    args = parser.parse_args()
    
    # Setup directories
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Check if dataset exists
    if not os.path.exists(args.data_dir):
        print(f"ERROR: Dataset directory not found at {args.data_dir}")
        print("Please download the PlantVillage dataset first.")
        print("See MODEL_INTEGRATION_PLAN.md for instructions.")
        return
    
    # Load Training and Validation Sets (80-20 split)
    print("Loading image datasets...")
    train_ds = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=(224, 224),
        batch_size=args.batch_size
    )
    
    val_ds = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=(224, 224),
        batch_size=args.batch_size
    )
    
    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Detected Classes: {class_names} ({num_classes} total)")
    
    # Optimize data loading pipeline
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
    
    # Build model
    model, base_model = build_transfer_learning_model(num_classes=num_classes)
    model.summary()
    
    # Compile
    model.compile(
        optimizer=optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Define callbacks
    model_filepath = os.path.join(args.output_dir, "plant_village_model.keras")
    my_callbacks = [
        callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, verbose=1),
        callbacks.ModelCheckpoint(filepath=model_filepath, monitor='val_accuracy', save_best_only=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1)
    ]
    
    # Train classifier head
    print("\nStarting training process...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=my_callbacks
    )
    
    # Evaluate
    print("\nEvaluating model on validation set...")
    val_loss, val_acc = model.evaluate(val_ds, verbose=1)
    print(f"Validation Loss: {val_loss:.4f}")
    print(f"Validation Accuracy: {val_acc * 100:.2f}%")
    
    # Optional fine-tuning
    if args.fine_tune:
        print("\nFine-tuning base model...")
        base_model.trainable = True
        
        # Fine-tune from this layer onwards
        fine_tune_at = 100
        for layer in base_model.layers[:fine_tune_at]:
            layer.trainable = False
        
        model.compile(
            optimizer=optimizers.Adam(learning_rate=0.0001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        model.fit(train_ds, validation_data=val_ds, epochs=5)
    
    # Convert to TFLite
    print("\nConverting to TFLite...")
    tflite_path = os.path.join(args.output_dir, "plant_village_model.tflite")
    convert_to_tflite_optimized(model, tflite_path)
    
    # Save class map
    class_map = {str(i): name for i, name in enumerate(class_names)}
    class_map_path = os.path.join(args.output_dir, "class_map.json")
    with open(class_map_path, 'w') as f:
        json.dump(class_map, f, indent=2)
    print(f"Class map saved to: {class_map_path}")
    
    print("\nTraining complete!")
    print(f"Model files saved to: {args.output_dir}")

if __name__ == "__main__":
    main()