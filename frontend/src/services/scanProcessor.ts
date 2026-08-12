import { saveOfflineReport } from './db';
import { analyzePlantWithBackend, diagnoseImageWithBackend } from './backendApi';
import { CropType, ScanPayload } from '../types/scan';

type ProcessScanInput = {
  imageUri: string;
  imageBase64?: string;
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
  if (normalized.includes('banana')) return 'Banana';
  return 'Unknown';
}

export async function processScanImage({
  imageUri,
  imageBase64,
  latitude,
  longitude,
}: ProcessScanInput): Promise<ScanPayload> {
  console.log('[scanProcessor] start', {
    hasUri: !!imageUri,
    hasBase64: !!imageBase64,
    base64Length: imageBase64?.length,
    latitude,
    longitude,
  });

  try {
    const scanStartTime = Date.now();
    // Try the new Green-Sense plant analysis endpoint first
    console.log('[scanProcessor] calling analyzePlantWithBackend...');
    const analysisResponse = await analyzePlantWithBackend(imageUri, imageBase64);
    console.log('[scanProcessor] analyzePlantWithBackend done', {
      plant_identified: analysisResponse.plant_identified,
      service_used: analysisResponse.summary?.service_used,
      confidence: analysisResponse.summary?.confidence,
      plant_name: analysisResponse.summary?.plant_name,
      scientific_name: analysisResponse.summary?.scientific_name,
    });
    
    if (analysisResponse.plant_identified) {
            // Successfully analyzed with Green-Sense — plant species + care guide.
      // NOTE: species identification (PlantNet/Gemini) and DISEASE diagnosis are
      // separate services. The disease label/severity/confidence must come from
      // the dedicated /diagnose service (Crop.health / Kindwise + local TFLite
      // disease model), so always run it here and prefer its result. The
      // care guide alone only yields generic/common diseases, which is why
      // scans looked accurate on the crop but wrong on the disease.
      const plantData = analysisResponse.plant_identification.plant_data;
      const summary = analysisResponse.summary;

      // Map plant name to crop type
      const cropType = normalizeCropType(plantData.plant_name || plantData.scientific_name);

      // Disease diagnosis (Crop.health / Kindwise + TFLite disease model)
      let diagnosis: any = null;
      try {
        console.log('[scanProcessor] Fetching disease diagnosis via /diagnose');
        diagnosis = await diagnoseImageWithBackend(imageUri, imageBase64);
      } catch (diagErr) {
        console.warn('[scanProcessor] Disease diagnosis unavailable, using care guide:', diagErr);
      }

      const careGuide = analysisResponse.care_recommendations?.care_guide;
      let diseaseLabel: string = plantData.plant_name || 'Unknown';
      let severity: 'Low' | 'Medium' | 'High' = 'Low';
      let confidenceScore: number = summary.confidence;

      if (diagnosis) {
        diseaseLabel = diagnosis.disease_label || diseaseLabel;
        severity = (diagnosis.severity as 'Low' | 'Medium' | 'High') || 'Low';
        confidenceScore = diagnosis.confidence_score ?? confidenceScore;
      } else if (careGuide) {
        const diseaseInfo = (careGuide as any).disease_info;
        if (diseaseInfo?.name) {
          diseaseLabel = diseaseInfo.name;
          severity = (diseaseInfo.severity as 'Low' | 'Medium' | 'High') || 'Low';
        } else if (careGuide.common_diseases?.[0]?.name) {
          diseaseLabel = careGuide.common_diseases[0].name;
          severity = 'Medium';
        }
      }

      const reportId = Math.random().toString(36).substring(2, 15);
      const scannedAt = new Date().toISOString();

      const diagnostic = {
        crop_type: cropType,
        disease_label: diseaseLabel,
        confidence_score: confidenceScore,
        severity,
        detected_raw_crop: plantData.plant_name,
        model_used: (diagnosis && diagnosis.model_used) || summary.service_used,
        plant_analysis: analysisResponse,
      };

      try {
        await saveOfflineReport({
          id: reportId,
          crop_type: cropType,
          disease_label: diseaseLabel,
          confidence_score: confidenceScore,
          latitude,
          longitude,
          severity,
          offline_created_at: scannedAt,
          image_url: imageUri,
          processing_time_ms: Date.now() - scanStartTime,
        });
      } catch (dbErr) {
        console.error('Scan saved but offline DB write failed:', dbErr);
      }

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
      // Fallback to local backend diagnosis endpoint if Green-Sense fails
      console.log('[scanProcessor] Green-Sense failed, falling back to diagnoseImageWithBackend');
      const backendPrediction = await diagnoseImageWithBackend(imageUri, imageBase64);
      const cropType = normalizeCropType(backendPrediction.crop_type || backendPrediction.detected_raw_crop);
      
      const reportId = Math.random().toString(36).substring(2, 15);
      const scannedAt = new Date().toISOString();

      const diagnostic = {
        crop_type: cropType,
        disease_label: backendPrediction.disease_label,
        confidence_score: backendPrediction.confidence_score,
        severity: backendPrediction.severity as 'Low' | 'Medium' | 'High',
        detected_raw_crop: backendPrediction.detected_raw_crop,
        model_used: backendPrediction.model_used || 'local-backend',
      };

      try {
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
          processing_time_ms: Date.now() - scanStartTime,
        });
      } catch (dbErr) {
        console.error('Scan saved but offline DB write failed:', dbErr);
      }

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
    const message = error instanceof Error ? error.message : String(error);
    console.error('[scanProcessor] All backend analysis methods failed:', message, error);
    throw new Error('Scan failed: ' + message);
  }
}
