import { API_BASE_URL } from '../config/api';
import { CropType } from '../types/scan';

export interface BackendPredictionResponse {
  crop_type: CropType | string;
  disease_label: string;
  confidence_score: number;
  severity: string;
  detected_raw_crop: string;
  green_ratio: number;
}

export interface PlantAnalysisResponse {
  timestamp: string;
  image_validated: boolean;
  plant_identified: boolean;
  care_recommendations_generated: boolean;
  pdf_report_generated: boolean;
  image_validation: {
    is_plant: boolean;
    confidence: number;
    reason: string;
    error: boolean;
  };
  plant_identification: {
    success: boolean;
    plant_data: {
      plant_name: string;
      scientific_name: string;
      family: string;
      confidence: number;
      characteristics: string[];
      care_level: string;
    };
    service_used: string;
    fallback_used: boolean;
    primary_failed?: boolean;
    error?: string;
    services_attempted?: string[];
  };
  care_recommendations: {
    success: boolean;
    care_guide: {
      watering: {
        frequency: string;
        amount: string;
        tips: string[];
      };
      light: {
        requirement: string;
        hours_per_day: number;
        tips: string[];
      };
      soil: {
        type: string;
        ph_range: string;
        drainage: string;
      };
      fertilizing: {
        frequency: string;
        type: string;
        season: string;
      };
      common_diseases: Array<{
        name: string;
        symptoms: string[];
        treatment: string;
        prevention: string;
      }>;
      general_tips: string[];
    };
    error?: string;
  };
  pdf_report: {
    success: boolean;
    report_path?: string;
    report_filename?: string;
    generated_at?: string;
    error?: string;
  };
  summary: {
    plant_name: string;
    scientific_name: string;
    confidence: number;
    service_used: string;
    fallback_used: boolean;
    care_guide_available: boolean;
    report_available: boolean;
  };
  error?: string;
  suggestion?: string;
  details?: string;
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

export async function analyzePlantWithBackend(imageUri: string): Promise<PlantAnalysisResponse> {
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
    const response = await fetch(`${API_BASE_URL}/api/v1/reports/analyze-plant`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Plant analysis failed:', error);
    throw error;
  }
}
