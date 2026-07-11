import { DiagnosticsResult } from '../services/tflite';

export type CropType = 'Banana' | 'Bean' | 'Cassava' | 'Coffee' | 'Corn' | 'Groundnuts' | 'Potato' | 'Tomato';

export type ScanPayload = {
  id: string;
  imageUri: string;
  diagnostic: DiagnosticsResult & { plant_analysis?: PlantAnalysisResponse };
  cropType: CropType;
  latitude: number;
  longitude: number;
  scannedAt: string;
};

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
