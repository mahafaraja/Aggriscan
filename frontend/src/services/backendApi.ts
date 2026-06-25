import { API_BASE_URL } from '../config/api';
import { CropType } from '../types/scan';

export interface BackendPredictionResponse {
  crop_type: CropType;
  disease_label: string;
  confidence_score: number;
  severity: string;
  detected_raw_crop: string;
  green_ratio: number;
}

export async function diagnoseImageWithBackend(imageUri: string): Promise<BackendPredictionResponse> {
  const formData = new FormData();
  
  // Extract filename from URI
  const uriParts = imageUri.split('/');
  const fileName = uriParts[uriParts.length - 1] || 'image.jpg';
  
  formData.append('file', {
    uri: imageUri,
    name: fileName,
    type: 'image/jpeg',
  } as any);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/reports/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Backend diagnosis failed:', error);
    throw error;
  }
}
