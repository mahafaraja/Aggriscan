import { API_BASE_URL } from '../config/api';
import { CropType } from '../types/scan';

export interface BackendPredictionResponse {
  crop_type: CropType | string;
  disease_label: string;
  confidence_score: number;
  severity: string;
  detected_raw_crop: string;
  green_ratio: number;
  model_used?: string;
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
      watering?: {
        frequency: string;
        amount: string;
        tips: string[];
      };
      light?: {
        requirement: string;
        hours_per_day: number;
        tips: string[];
      };
      soil?: {
        type: string;
        ph_range: string;
        drainage: string;
      };
      fertilizing?: {
        frequency: string;
        type: string;
        season: string;
      };
      common_diseases?: Array<{
        name: string;
        symptoms: string[];
        treatment: string;
        prevention: string;
      }>;
      general_tips?: string[];
      disease_info?: {
        name: string;
        severity: string;
        symptoms: string[];
        immediate_actions: string[];
      };
      treatment?: {
        chemical: string[];
        organic: string[];
      };
      prevention?: string[];
      monitoring?: {
        frequency: string;
        signs_of_recovery: string[];
        when_to_seek_help: string;
      };
      source?: string;
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

export interface UserStatisticsResponse {
  total_scans: number;
  healthy_count: number;
  diseased_count: number;
  diseases_detected: number;
  diseases_list: Array<{ name: string; count: number }>;
  avg_confidence: number;
}

function getFilename(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] || 'image.jpg';
}

async function ensureBase64(imageUri: string, imageBase64?: string): Promise<string> {
  if (imageBase64) {
    console.log('[backendApi] ensureBase64 using provided base64, length:', imageBase64.length);
    return imageBase64;
  }

  console.log('[backendApi] ensureBase64 reading from uri:', imageUri);
  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error(`Failed to read local image: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  console.log('[backendApi] ensureBase64 bytes length:', bytes.byteLength);

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  const base64 = btoa(binary);
  console.log('[backendApi] ensureBase64 result length:', base64.length);
  return base64;
}

export async function diagnoseImageWithBackend(
  imageUri: string,
  imageBase64?: string
): Promise<BackendPredictionResponse> {
  const base64 = await ensureBase64(imageUri, imageBase64);
  const filename = getFilename(imageUri);
  const url = `${API_BASE_URL}/api/v1/reports/diagnose`;

  console.log('[backendApi] POST diagnose', {
    url,
    filename,
    base64Length: base64.length,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        filename,
      }),
    });

    console.log('[backendApi] diagnose response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    console.log('[backendApi] diagnose response keys:', Object.keys(data));
    return data;
  } catch (error) {
    console.error('[backendApi] Backend diagnosis failed:', error);
    throw error;
  }
}

export async function analyzePlantWithBackend(
  imageUri: string,
  imageBase64?: string
): Promise<PlantAnalysisResponse> {
  const base64 = await ensureBase64(imageUri, imageBase64);
  const filename = getFilename(imageUri);
  const url = `${API_BASE_URL}/api/v1/reports/analyze-plant`;

  console.log('[backendApi] POST analyze-plant', {
    url,
    filename,
    base64Length: base64.length,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        filename,
      }),
    });

    console.log('[backendApi] analyze-plant response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    console.log('[backendApi] analyze-plant response keys:', Object.keys(data));
    return data;
  } catch (error) {
    console.error('[backendApi] Plant analysis failed:', error);
    throw error;
  }
}

export async function getUserStatistics(): Promise<UserStatisticsResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}/api/v1/reports/statistics`;

  console.log('[backendApi] GET statistics', { url });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    console.log('[backendApi] statistics response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    console.log('[backendApi] statistics response:', data);
    return data;
  } catch (error) {
    console.error('[backendApi] Statistics fetch failed:', error);
    throw error;
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.default.getItemAsync('auth_token');
  } catch (error) {
    console.error('[backendApi] Error getting auth token:', error);
    return null;
  }
}
