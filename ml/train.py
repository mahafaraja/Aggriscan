import os
import argparse
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, losses, callbacks

def create_synthetic_dataset(data_dir, num_samples=100, image_size=(224, 224)):
    """
    Utility function to create a synthetic directory structure and dummy images
    for testing the training script when real datasets are not yet available.
    """
    classes = ['Cassava_CMD', 'Cassava_Healthy', 'Banana_BBW', 'Banana_Healthy', 'Background_Noise']
    print(f"Creating synthetic dataset in '{data_dir}' for testing...")
    
    for cls in classes:
        cls_dir = os.path.join(data_dir, cls)
        os.makedirs(cls_dir, exist_ok=True)
        for i in range(num_samples):
            # Generate random noise images as placeholders
            img = np.random.randint(0, 256, size=(image_size[0], image_size[1], 3), dtype=np.uint8)
            tf.keras.utils.save_img(os.path.join(cls_dir, f"dummy_{i}.jpg"), img)
            
    print("Synthetic dataset created successfully.")

def build_data_augmentation():
    """
    Constructs a sequential Keras layer block for on-the-fly data augmentation.
    These layers are only active during training.
    """
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(factor=0.2), # rotate up to 72 degrees
        layers.RandomZoom(height_factor=0.15, width_factor=0.15),
        layers.RandomContrast(factor=0.15),
    ], name="data_augmentation")
    return data_augmentation

def build_lightweight_cnn(input_shape=(224, 224, 3), num_classes=5):
    """
    Constructs a lightweight CNN model suitable for mobile inference.
    Uses Depthwise Separable Convolutions (SeparableConv2D) to minimize parameter count
    and computational latency while retaining representational capacity.
    """
    inputs = layers.Input(shape=input_shape)
    
    # Apply data augmentation
    x = build_data_augmentation()(inputs)
    
    # Rescale pixel values from [0, 255] to [0, 1]
    x = layers.Rescaling(1./255)(x)
    
    # 1st Block: Standard convolution for initial channel expansion
    x = layers.Conv2D(32, (3, 3), strides=2, padding='same', use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.MaxPooling2D((2, 2))(x)
    
    # 2nd Block: Separable Conv to save parameters
    x = layers.SeparableConv2D(64, (3, 3), padding='same', use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.MaxPooling2D((2, 2))(x)
    
    # 3rd Block
    x = layers.SeparableConv2D(128, (3, 3), padding='same', use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.MaxPooling2D((2, 2))(x)
    
    # 4th Block
    x = layers.SeparableConv2D(256, (3, 3), padding='same', use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)
    x = layers.GlobalAveragePooling2D()(x) # Drastically reduces dense layer parameter weight
    
    # Dense Classifier Head
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, name="outputs")(x) # Raw logits for numerical stability in loss function
    
    model = models.Model(inputs=inputs, outputs=outputs, name="Lightweight_Crop_CNN")
    return model

def convert_to_tflite(keras_model_path, tflite_output_path, val_ds=None):
    """
    Loads a saved Keras model and converts it to TensorFlow Lite (.tflite) format.
    Supports both standard Float16 conversion and full INT8 quantization.
    """
    print("Initializing TensorFlow Lite conversion...")
    model = tf.keras.models.load_model(keras_model_path)
    
    # 1. Float16 Quantization (good balance of performance and compatibility)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    
    tflite_fp16 = converter.convert()
    fp16_path = tflite_output_path.replace(".tflite", "_fp16.tflite")
    with open(fp16_path, "wb") as f:
        f.write(tflite_fp16)
    print(f"Float16 quantized model saved to: {fp16_path}")
    
    # 2. Full INT8 Quantization (requires representative dataset calibration)
    if val_ds is not None:
        print("Calibrating model for full INT8 quantization...")
        int8_converter = tf.lite.TFLiteConverter.from_keras_model(model)
        int8_converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        # Generator for calibration samples
        def representative_dataset():
            # Extract a batch of images from validation dataset
            for images, _ in val_ds.take(5):
                for img in images:
                    # Expand dimensions to (1, 224, 224, 3)
                    yield [tf.expand_dims(img, axis=0)]
                    
        int8_converter.representative_dataset = representative_dataset
        # Force operations to be INT8
        int8_converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        int8_converter.inference_input_type = tf.uint8
        int8_converter.inference_output_type = tf.uint8
        
        try:
            tflite_int8 = int8_converter.convert()
            int8_path = tflite_output_path.replace(".tflite", "_int8.tflite")
            with open(int8_path, "wb") as f:
                f.write(tflite_int8)
            print(f"INT8 integer quantized model saved to: {int8_path}")
        except Exception as e:
            print(f"INT8 conversion failed (likely due to unsupported operations): {e}")
            print("Defaulting to standard dynamic range quantization...")
            # Fallback dynamic range quantization
            int8_converter = tf.lite.TFLiteConverter.from_keras_model(model)
            int8_converter.optimizations = [tf.lite.Optimize.DEFAULT]
            tflite_dyn = int8_converter.convert()
            dyn_path = tflite_output_path.replace(".tflite", "_dynamic.tflite")
            with open(dyn_path, "wb") as f:
                f.write(tflite_dyn)
            print(f"Dynamic range quantized model saved to: {dyn_path}")

def main():
    parser = argparse.ArgumentParser(description="Agriscan Lightweight CNN Training Pipeline")
    parser.add_argument("--data_dir", type=str, default="./dataset", help="Path to image dataset directory")
    parser.add_argument("--model_dir", type=str, default="./models", help="Directory to save Keras models")
    parser.add_argument("--tflite_dir", type=str, default="./tflite", help="Directory to save TFLite models")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size for training")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate for Adam optimizer")
    parser.add_argument("--generate_mock", action="store_true", help="Generate dummy synthetic images to test script")
    
    args = parser.parse_args()
    
    # Setup directories
    os.makedirs(args.model_dir, exist_ok=True)
    os.makedirs(args.tflite_dir, exist_ok=True)
    
    # Optional Mock Data generation
    if args.generate_mock or not os.path.exists(args.data_dir):
        create_synthetic_dataset(args.data_dir)
        
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
    
    # Optimize data loading pipeline for performance
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
    
    # Instantiate Model
    print("Compiling model architecture...")
    model = build_lightweight_cnn(input_shape=(224, 224, 3), num_classes=num_classes)
    model.summary()
    
    # Configure training parameters
    model.compile(
        optimizer=optimizers.Adam(learning_rate=args.lr),
        loss=losses.SparseCategoricalCrossentropy(from_logits=True),
        metrics=['accuracy']
    )
    
    # Define callbacks for training control
    model_filepath = os.path.join(args.model_dir, "crop_disease_model.keras")
    my_callbacks = [
        callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, verbose=1),
        callbacks.ModelCheckpoint(filepath=model_filepath, monitor='val_accuracy', save_best_only=True, verbose=1)
    ]
    
    # Start Model Training
    print("Starting training process...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=my_callbacks
    )
    
    # Evaluate model accuracy on validation set
    print("\nEvaluating model on validation set...")
    val_loss, val_acc = model.evaluate(val_ds, verbose=1)
    print(f"Validation Loss: {val_loss:.4f}")
    print(f"Validation Accuracy: {val_acc * 100:.2f}%")
    
    # Perform TFLite conversion
    tflite_path = os.path.join(args.tflite_dir, "crop_disease_model.tflite")
    convert_to_tflite(model_filepath, tflite_path, val_ds)

if __name__ == "__main__":
    main()
