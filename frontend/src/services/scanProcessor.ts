import { saveOfflineReport } from './db';
import { analyzePlantWithBackend, diagnoseImageWithBackend } from './backendApi';
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
    // Try the new Green-Sense plant analysis endpoint first
    const analysisResponse = await analyzePlantWithBackend(imageUri);
    
    if (analysisResponse.plant_identified) {
      // Successfully analyzed with Green-Sense
      const plantData = analysisResponse.plant_identification.plant_data;
      const summary = analysisResponse.summary;
      
      // Map plant name to crop type
      const cropType = normalizeCropType(plantData.plant_name || plantData.scientific_name);
      
      const reportId = Math.random().toString(36).substring(2, 15);
      const scannedAt = new Date().toISOString();

      // Create diagnostic object compatible with existing structure
      const diagnostic = {
        crop_type: cropType,
        disease_label: plantData.plant_name,
        confidence_score: summary.confidence,
        severity: 'Low' as const,
        detected_raw_crop: plantData.plant_name,
        model_used: summary.service_used,
        // Additional Green-Sense data
        plant_analysis: analysisResponse
      };

      await saveOfflineReport({
        id: reportId,
        crop_type: cropType,
        disease_label: plantData.plant_name,
        confidence_score: summary.confidence,
        latitude,
        longitude,
        severity: 'Low',
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
    } else {
      // Fallback to old diagnosis endpoint if Green-Sense fails
      console.log('Green-Sense analysis failed, falling back to TFLite diagnosis');
      const backendPrediction = await diagnoseImageWithBackend(imageUri);
      const cropType = normalizeCropType(backendPrediction.crop_type || backendPrediction.detected_raw_crop);
      
      const reportId = Math.random().toString(36).substring(2, 15);
      const scannedAt = new Date().toISOString();

      const diagnostic = {
        crop_type: cropType,
        disease_label: backendPrediction.disease_label,
        confidence_score: backendPrediction.confidence_score,
        severity: backendPrediction.severity as 'Low' | 'Medium' | 'High',
        detected_raw_crop: backendPrediction.detected_raw_crop,
        model_used: 'tflite-fallback'
      };

      await saveOfflineReport({
        id: reportId,
        crop_type: cropType,
        disease_label: backendPrediction.disease_label,
        confidence_score: backendPrediction.confidence_score,
        latitude,
        longitude,
        severity: backendPrediction.severity,
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
  } catch (error) {
    console.error('All backend analysis methods failed:', error);
    throw new Error('Could not process this photo. Please try another clear leaf image.');
  }
}
