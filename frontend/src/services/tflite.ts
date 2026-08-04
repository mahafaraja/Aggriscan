/**
 * TFLite Model Service
 * 
 * DEPRECATED - TFLite is not supported on Android.
 * All inference is now handled by the backend API via FrontendInferenceService.
 * 
 * This file is kept as a stub for backward compatibility with imports.
 */

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
 * DEPRECATED - Not supported on Android.
 * Use FrontendInferenceService instead.
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
   * Initializes the service.
   * DEPRECATED - Always returns false on Android.
   */
  public async initModel(): Promise<void> {
    console.warn('TFLiteModelService is deprecated and not supported on Android');
    this.isModelLoaded = false;
  }

  /**
   * Run inference on the captured crop image.
   * DEPRECATED - Always throws error on Android.
   */
  public async classifyCropImage(imageUri: string): Promise<DiagnosticsResult> {
    throw new Error('TFLiteModelService is deprecated and not supported on Android. Use FrontendInferenceService instead.');
  }

  /**
   * Check if the service is ready.
   * DEPRECATED - Always returns false on Android.
   */
  public isReady(): boolean {
    return false;
  }
}