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
 * Frontend Inference Service
 * 
 * Uses backend API for all inference (TFLite not supported on Android)
 */
export class FrontendInferenceService {
  private static instance: FrontendInferenceService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): FrontendInferenceService {
    if (!FrontendInferenceService.instance) {
      FrontendInferenceService.instance = new FrontendInferenceService();
    }
    return FrontendInferenceService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    console.log('Frontend Inference: Initializing - using backend API');
    this.isInitialized = true;
  }

  public async classifyImage(imageUri: string): Promise<DiagnosticsResult> {
    console.log('Frontend Inference: Starting classification via backend API');

    try {
      const backendResult = await this.runBackendInference(imageUri);
      if (backendResult) {
        console.log('Frontend Inference: Success using backend .keras model');
        return {
          ...backendResult,
          model_used: 'backend_keras',
          fallback_used: false,
        };
      }
    } catch (error) {
      console.error('Frontend Inference: Backend inference failed:', error);
    }

    console.warn('Frontend Inference: All methods failed, using mock fallback');
    return this.getMockDiagnostic();
  }

  private async runBackendInference(imageUri: string): Promise<DiagnosticsResult | null> {
    try {
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
        throw new Error(`Backend returned status ${response.status}`);
      }

      const result = await response.json();

      return {
        crop_type: result.crop_type,
        disease_label: result.disease_label,
        confidence_score: result.confidence_score,
        severity: result.severity as 'Low' | 'Medium' | 'High',
        detected_raw_crop: result.detected_raw_crop,
        green_ratio: result.green_ratio,
      };
    } catch (error) {
      console.error('Backend inference failed:', error);
      return null;
    }
  }

  private normalizeCropType(
    plantName: string
  ): 'Banana' | 'Bean' | 'Cassava' | 'Coffee' | 'Corn' | 'Groundnuts' | 'Potato' | 'Tomato' {
    const normalized = plantName.toLowerCase();

    if (normalized.includes('cassava')) return 'Cassava';
    if (normalized.includes('bean')) return 'Bean';
    if (normalized.includes('coffee')) return 'Coffee';
    if (normalized.includes('corn') || normalized.includes('maize')) return 'Corn';
    if (normalized.includes('groundnut') || normalized.includes('peanut')) return 'Groundnuts';
    if (normalized.includes('potato')) return 'Potato';
    if (normalized.includes('tomato')) return 'Tomato';
    return 'Banana';
  }

  private getMockDiagnostic(): DiagnosticsResult {
    const potentialClasses = [
      { label: 'Cassava_CMD', crop: 'Cassava' as const, severity: 'High' as const },
      { label: 'Banana_BBW', crop: 'Banana' as const, severity: 'High' as const },
      { label: 'Cassava_Healthy', crop: 'Cassava' as const, severity: 'Low' as const },
      { label: 'Banana_Healthy', crop: 'Banana' as const, severity: 'Low' as const },
    ];

    const match = potentialClasses[Math.floor(Math.random() * potentialClasses.length)];
    const confidence = parseFloat((0.7 + Math.random() * 0.28).toFixed(4));

    return {
      crop_type: match.crop,
      disease_label: match.label,
      confidence_score: confidence,
      severity: confidence > 0.85 ? 'High' : match.severity,
      model_used: 'mock_fallback',
      fallback_used: true,
    };
  }

  public isTFLiteAvailable(): boolean {
    return false;
  }

  public getModelInfo(): { frontend: boolean; backend: boolean; gemini: boolean } {
    return {
      frontend: false,
      backend: true,
      gemini: false,
    };
  }
}