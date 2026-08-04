import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Image Preprocessing Utility
 *
 * Converts an image URI to a Float32Array suitable for TFLite model input.
 * Uses expo-image-manipulator to resize the image to the target dimensions,
 * then decodes the base64 PNG data to raw RGBA pixels and normalizes to [-1, 1].
 *
 * MobileNetV2 expects input shape [1, 224, 224, 3] with values normalized to [-1, 1].
 * The normalization formula is: pixel_value * (2 / 255) - 1
 */

const MODEL_INPUT_SIZE = 224;

/**
 * Decode a base64 string to a Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Simple PNG decoder that extracts RGBA pixel data from a PNG Uint8Array.
 * This handles the basic PNG format (RGBA 8-bit).
 * For production, consider using a native module or more robust decoder.
 */
function decodePngToRgba(pngBytes: Uint8Array, expectedWidth: number, expectedHeight: number): Uint8Array | null {
  try {
    // PNG signature check
    if (pngBytes.length < 8) return null;
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
      if (pngBytes[i] !== signature[i]) return null;
    }

    // Parse IHDR chunk
    let offset = 8;
    const width = (pngBytes[offset + 7] << 24) | (pngBytes[offset + 8] << 16) | (pngBytes[offset + 9] << 8) | pngBytes[offset + 10];
    const height = (pngBytes[offset + 11] << 24) | (pngBytes[offset + 12] << 16) | (pngBytes[offset + 13] << 8) | pngBytes[offset + 14];
    const bitDepth = pngBytes[offset + 15];
    const colorType = pngBytes[offset + 16];

    // Only support 8-bit RGBA (color type 6) and 8-bit RGB (color type 2)
    if (bitDepth !== 8) return null;
    if (colorType !== 6 && colorType !== 2) return null;
    const channels = colorType === 6 ? 4 : 3;

    // Collect all IDAT chunks
    const idatChunks: Uint8Array[] = [];
    offset = 8;
    while (offset < pngBytes.length - 8) {
      // Read chunk length (4 bytes, big-endian)
      const chunkLength = ((pngBytes[offset] << 24) | (pngBytes[offset + 1] << 16) | (pngBytes[offset + 2] << 8) | pngBytes[offset + 3]) >>> 0;
      const chunkType = String.fromCharCode(pngBytes[offset + 4], pngBytes[offset + 5], pngBytes[offset + 6], pngBytes[offset + 7]);

      if (chunkType === 'IDAT') {
        const chunkData = pngBytes.subarray(offset + 8, offset + 8 + chunkLength);
        idatChunks.push(new Uint8Array(chunkData));
      }

      offset += 12 + chunkLength; // 4 (length) + 4 (type) + data + 4 (CRC)

      if (chunkType === 'IEND') break;
    }

    if (idatChunks.length === 0) return null;

    // Concatenate all IDAT chunks
    const totalLength = idatChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const compressedData = new Uint8Array(totalLength);
    let pos = 0;
    for (const chunk of idatChunks) {
      compressedData.set(chunk, pos);
      pos += chunk.length;
    }

    // Decompress using pako/zlib (if available) or React Native's built-in decompression
    // In React Native, we can use the global decompression or a polyfill
    let decompressed: Uint8Array;
    try {
      // Try using pako if available
      const pako = require('pako');
      decompressed = pako.inflate(compressedData);
    } catch (e) {
      // Fallback: use React Native's built-in atob/btoa based decompression
      // This is a simplified approach - for production use a proper zlib library
      console.warn('ImagePreprocessing: pako not available, trying alternative decompression');
      try {
        // Try using react-native's built-in decompression via fetch
        const { inflate } = require('react-native-zlib');
        decompressed = inflate(compressedData);
      } catch (e2) {
        console.error('ImagePreprocessing: No zlib library available for PNG decompression');
        return null;
      }
    }

    // Remove PNG filter bytes (un-filtering)
    const stride = width * channels + 1; // +1 for filter byte per scanline
    const unfiltered = new Uint8Array(width * height * channels);

    for (let y = 0; y < height; y++) {
      const scanlineStart = y * stride;
      const filterType = decompressed[scanlineStart];

      for (let x = 0; x < width; x++) {
        const srcIdx = scanlineStart + 1 + x * channels;
        const dstIdx = (y * width + x) * channels;

        switch (filterType) {
          case 0: // None
            for (let c = 0; c < channels; c++) {
              unfiltered[dstIdx + c] = decompressed[srcIdx + c];
            }
            break;
          case 1: // Sub
            for (let c = 0; c < channels; c++) {
              const left = x > 0 ? unfiltered[dstIdx - channels + c] : 0;
              unfiltered[dstIdx + c] = (decompressed[srcIdx + c] + left) & 0xff;
            }
            break;
          case 2: // Up
            for (let c = 0; c < channels; c++) {
              const up = y > 0 ? unfiltered[dstIdx - width * channels + c] : 0;
              unfiltered[dstIdx + c] = (decompressed[srcIdx + c] + up) & 0xff;
            }
            break;
          case 3: // Average
            for (let c = 0; c < channels; c++) {
              const left = x > 0 ? unfiltered[dstIdx - channels + c] : 0;
              const up = y > 0 ? unfiltered[dstIdx - width * channels + c] : 0;
              unfiltered[dstIdx + c] = (decompressed[srcIdx + c] + Math.floor((left + up) / 2)) & 0xff;
            }
            break;
          case 4: // Paeth
            for (let c = 0; c < channels; c++) {
              const left = x > 0 ? unfiltered[dstIdx - channels + c] : 0;
              const up = y > 0 ? unfiltered[dstIdx - width * channels + c] : 0;
              const upLeft = x > 0 && y > 0 ? unfiltered[dstIdx - width * channels - channels + c] : 0;
              const p = left + up - upLeft;
              const pa = Math.abs(p - left);
              const pb = Math.abs(p - up);
              const pc = Math.abs(p - upLeft);
              let predictor: number;
              if (pa <= pb && pa <= pc) predictor = left;
              else if (pb <= pc) predictor = up;
              else predictor = upLeft;
              unfiltered[dstIdx + c] = (decompressed[srcIdx + c] + predictor) & 0xff;
            }
            break;
        }
      }
    }

    return unfiltered;
  } catch (error) {
    console.error('ImagePreprocessing: PNG decode error:', error);
    return null;
  }
}

/**
 * Convert RGBA pixel data to RGB Float32Array normalized to [-1, 1].
 * MobileNetV2 normalization: pixel * (2 / 255) - 1
 */
function rgbaToNormalizedFloat32(
  rgba: Uint8Array,
  width: number,
  height: number,
  hasAlpha: boolean
): Float32Array {
  const channels = hasAlpha ? 4 : 3;
  const pixelCount = width * height;
  const float32 = new Float32Array(pixelCount * 3); // RGB only

  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 3;
    // Normalize to [-1, 1]: pixel * (2 / 255) - 1
    float32[dstIdx] = (rgba[srcIdx] * (2 / 255)) - 1; // R
    float32[dstIdx + 1] = (rgba[srcIdx + 1] * (2 / 255)) - 1; // G
    float32[dstIdx + 2] = (rgba[srcIdx + 2] * (2 / 255)) - 1; // B
  }

  return float32;
}

/**
 * Load an image from a URI, resize it to 224x224, and convert to Float32Array
 * suitable for TFLite MobileNetV2 model input.
 *
 * @param imageUri The URI of the image to process
 * @returns Float32Array of shape [224*224*3] normalized to [-1, 1], or null on failure
 */
export async function preprocessImageForTFLite(imageUri: string): Promise<Float32Array | null> {
  try {
    console.log(`ImagePreprocessing: Processing image: ${imageUri}`);

    // Step 1: Resize image to 224x224 using expo-image-manipulator
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
      { base64: true, format: SaveFormat.PNG }
    );

    if (!result.base64) {
      console.error('ImagePreprocessing: No base64 data returned from image manipulator');
      return null;
    }

    console.log(`ImagePreprocessing: Got base64 data, length=${result.base64.length}`);
    console.log(`ImagePreprocessing: Image dimensions: ${result.width}x${result.height}`);

    // Step 2: Decode base64 to Uint8Array (raw PNG bytes)
    const pngBytes = base64ToUint8Array(result.base64);

    // Step 3: Decode PNG to RGBA pixels
    const rgba = decodePngToRgba(pngBytes, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
    if (!rgba) {
      console.error('ImagePreprocessing: Failed to decode PNG to RGBA');
      return null;
    }

    // Step 4: Convert to normalized Float32Array
    const float32Data = rgbaToNormalizedFloat32(rgba, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, true);

    console.log(`ImagePreprocessing: Successfully preprocessed image to Float32Array of size ${float32Data.length}`);
    return float32Data;
  } catch (error) {
    console.error('ImagePreprocessing: Failed to preprocess image:', error);
    return null;
  }
}

/**
 * Get the model input size (224 for MobileNetV2).
 */
export function getModelInputSize(): number {
  return MODEL_INPUT_SIZE;
}