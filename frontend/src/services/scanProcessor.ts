import { saveOfflineReport } from './db';
import { TFLiteModelService } from './tflite';
import { ScanPayload } from '../types/scan';

type ProcessScanInput = {
  imageUri: string;
  latitude: number;
  longitude: number;
};

export async function processScanImage({
  imageUri,
  latitude,
  longitude,
}: ProcessScanInput): Promise<ScanPayload> {
  const tfliteService = TFLiteModelService.getInstance();
  const diagnostic = await tfliteService.classifyCropImage(imageUri);
  const cropType =
    diagnostic.crop_type ??
    (diagnostic.disease_label.toLowerCase().includes('cassava') ? 'Cassava' : 'Banana');

  const reportId = Math.random().toString(36).substring(2, 15);
  const scannedAt = new Date().toISOString();

  await saveOfflineReport({
    id: reportId,
    crop_type: cropType,
    disease_label: diagnostic.disease_label,
    confidence_score: diagnostic.confidence_score,
    latitude,
    longitude,
    severity: diagnostic.severity,
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
}
