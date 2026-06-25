import { DiagnosticsResult } from '../services/tflite';

export type CropType = 'Banana' | 'Bean' | 'Cassava' | 'Coffee' | 'Corn' | 'Groundnuts' | 'Potato' | 'Tomato';

export type ScanPayload = {
  id: string;
  imageUri: string;
  diagnostic: DiagnosticsResult;
  cropType: CropType;
  latitude: number;
  longitude: number;
  scannedAt: string;
};
