import { API_BASE_URL } from '../config/api';

export interface DiagnosticsResult {
  crop_type?: 'Banana' | 'Bean' | 'Cassava' | 'Coffee' | 'Corn' | 'Groundnuts' | 'Potato' | 'Tomato';
  disease_label: string;
  confidence_score: number;
  severity: 'Low' | 'Medium' | 'High';
  detected_raw_crop?: string;
  green_ratio?: number;
  model_used?: string;
  fallback_used?: boolean;
}

/**
 * TFLiteModelService
 *
 * NOTE: react-native-fast-tflite does not support Android (native code is stubbed out).
 * The backend API is used as the primary inference method, with a mock fallback.
 */
export class TFLiteModelService {
  private static instance: TFLiteModelService;
  private isModelLoaded: boolean = false;

  private constructor() {}

  public static getInstance(): TFLiteModelService {
    if (!TFLiteModelService.instance) {
      TFLiteModelService.instance = new TFLiteModelService();
    }
    return TFLiteModelService.instance;
  }

  /**
   * Initializes the service. Since react-native-fast-tflite doesn't support Android,
   * this just marks the service as ready for backend inference.
   */
  public async initModel(): Promise<void> {
    console.log('TFLite Engine: Using backend API for inference (react-native-fast-tflite does not support Android)');
    this.isModelLoaded = true;
  }

  /**
   * Run inference on the captured crop image.
   * Uses the backend API as the primary method, with mock fallback.
   */
  public async classifyCropImage(imageUri: string): Promise<DiagnosticsResult> {
    console.log(`Frontend Model Service: Processing image: ${imageUri}`);

    // Strategy 1: Use backend API
    try {
      return await this.classifyViaBackend(imageUri);
    } catch (e) {
      console.warn('Frontend Model Service: Backend diagnose API failed, falling back to mock:', e);
      return this.executeMockDiagnosticFallback();
    }
  }

  /**
   * Send image to backend diagnostic API.
   */
  private async classifyViaBackend(imageUri: string): Promise<DiagnosticsResult> {
    console.log(`Frontend Model Service: Sending image to backend: ${imageUri} (${API_BASE_URL})`);

    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'crop_image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/api/v1/reports/diagnose`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server diagnostic endpoint returned status ${response.status}`);
    }

    const result = await response.json();
    console.log('Frontend Model Service: Received diagnosis result:', result);

    return {
      crop_type: result.crop_type,
      disease_label: result.disease_label,
      confidence_score: result.confidence_score,
      severity: result.severity as 'Low' | 'Medium' | 'High',
      detected_raw_crop: result.detected_raw_crop,
      green_ratio: result.green_ratio,
      model_used: 'backend_keras',
      fallback_used: false,
    };
  }

  /**
   * Check if the service is ready.
   */
  public isReady(): boolean {
    return this.isModelLoaded;
  }

  private executeMockDiagnosticFallback(): Promise<DiagnosticsResult> {
    return new Promise((resolve) => {
      // Simulate hardware inference delay of 450ms
      setTimeout(() => {
        const potentialClasses = [
          { label: 'Cassava_CMD', severity: 'High' as const },
          { label: 'Banana_BBW', severity: 'High' as const },
          { label: 'Cassava_Healthy', severity: 'Low' as const },
          { label: 'Banana_Healthy', severity: 'Low' as const },
        ];

        // Randomly pick class output for simulation
        const match = potentialClasses[Math.floor(Math.random() * potentialClasses.length)];
        const confidence = parseFloat((0.7 + Math.random() * 0.28).toFixed(4));

        resolve({
          crop_type: match.label.includes('Cassava') ? 'Cassava' : 'Banana',
          disease_label: match.label,
          confidence_score: confidence,
          severity: confidence > 0.85 ? 'High' : match.severity,
          model_used: 'mock_fallback',
          fallback_used: true,
        });
      }, 450);
    });
  }
}