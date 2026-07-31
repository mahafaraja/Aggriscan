import { saveOfflineReport } from './db';
import { FrontendInferenceService } from './frontendInference';
import { CropType, ScanPayload } from '../types/scan';

type ProcessScanInput = {
  imageUri: string;
  latitude: number;
  longitude: number;
};

function normalizeCropType(value?: string): CropType {
  const normalized = (value || '').toLowerCase();

  if (normalized.includes('cassava')) return 'Cassava';
  if (normalized.includes('bean')) return 'Bean';
  if (normalized.includes('coffee')) return 'Coffee';
  if (normalized.includes('corn') || normalized.includes('maize')) return 'Corn';
  if (normalized.includes('groundnut') || normalized.includes('peanut')) return 'Groundnuts';
  if (normalized.includes('potato')) return 'Potato';
  if (normalized.includes('tomato')) return 'Tomato';
  return 'Banana';
}

export async function processScanImage({
  imageUri,
  latitude,
  longitude,
}: ProcessScanInput): Promise<ScanPayload> {
  try {
    // Use new frontend-first inference service with fallback chain
    console.log('Scan Processor: Starting frontend-first inference');
    const inferenceService = FrontendInferenceService.getInstance();
    const result = await inferenceService.classifyImage(imageUri);
    
    const cropType = normalizeCropType(result.crop_type || result.detected_raw_crop);
    const reportId = Math.random().toString(36).substring(2, 15);
    const scannedAt = new Date().toISOString();

    const diagnostic = {
      crop_type: cropType,
      disease_label: result.disease_label,
      confidence_score: result.confidence_score,
      severity: result.severity as 'Low' | 'Medium' | 'High',
      detected_raw_crop: result.detected_raw_crop,
      green_ratio: result.green_ratio,
      model_used: result.model_used,
      fallback_used: result.fallback_used
    };

    await saveOfflineReport({
      id: reportId,
      crop_type: cropType,
      disease_label: result.disease_label,
      confidence_score: result.confidence_score,
      latitude,
      longitude,
      severity: result.severity,
      offline_created_at: scannedAt,
      image_url: imageUri,
    });

    return {
      id: reportId,
      imageUri,
      diagnostic,
      cropType,
      latitude,
      longitude,
      scannedAt,
    };
  } catch (error) {
    console.error('All inference methods failed:', error);
    throw new Error('Could not process this photo. Please try another clear leaf image.');
  }
}
