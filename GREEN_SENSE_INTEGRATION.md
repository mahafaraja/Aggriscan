# Green-Sense Integration for Agriscan

## Overview

The Green-Sense integration replaces the local TFLite model inference with a multi-service cloud-based plant identification system. This provides more accurate and comprehensive plant analysis with the following 5-step pipeline:

1. **Image Validation** - Validates if the uploaded image contains a plant
2. **Plant Identification** - Identifies plant species using primary service (Gemini)
3. **Fallback Identification** - Automatically falls back to secondary services (PlantID, PlantNet)
4. **Care Recommendations** - Generates comprehensive care and treatment guides
5. **PDF Report** - Creates professional PDF reports with all analysis details

## Architecture

### Backend Changes

#### New Service: `backend/app/services/plant_identification.py`

This service implements the complete Green-Sense pipeline:

- **ImageValidationService**: Uses Gemini API to validate if an image contains a plant
- **PlantIdentificationService**: Multi-service identification with automatic fallback:
  - Primary: Gemini API
  - Fallback 1: PlantID API
  - Fallback 2: PlantNet API
- **CareRecommendationService**: Generates detailed care guides and treatment plans
- **PDFReportGenerator**: Creates professional PDF reports using ReportLab

#### New API Endpoint: `POST /api/v1/reports/analyze-plant`

**Location**: `backend/app/routers/reports.py`

This public endpoint accepts an image upload and returns comprehensive analysis including:
- Image validation results
- Plant identification with confidence scores
- Care recommendations
- PDF report generation status
- Service usage information (which API was used, if fallback was triggered)

**Request Format**:
```bash
curl -X POST "http://localhost:8000/api/v1/reports/analyze-plant" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@plant_image.jpg"
```

**Response Format**:
```json
{
  "timestamp": "2026-11-11T12:00:00",
  "image_validated": true,
  "plant_identified": true,
  "care_recommendations_generated": true,
  "pdf_report_generated": true,
  "image_validation": {
    "is_plant": true,
    "confidence": 0.95,
    "reason": "Clear leaf image",
    "error": false
  },
  "plant_identification": {
    "success": true,
    "plant_data": {
      "plant_name": "Cassava",
      "scientific_name": "Manihot esculenta",
      "family": "Euphorbiaceae",
      "confidence": 0.92,
      "characteristics": ["palmate leaves", "green color"],
      "care_level": "intermediate"
    },
    "service_used": "gemini",
    "fallback_used": false
  },
  "care_recommendations": {
    "success": true,
    "care_guide": {
      "watering": {...},
      "light": {...},
      "soil": {...},
      "common_diseases": [...]
    }
  },
  "pdf_report": {
    "success": true,
    "report_filename": "plant_analysis_20261111_120000.pdf"
  },
  "summary": {
    "plant_name": "Cassava",
    "scientific_name": "Manihot esculenta",
    "confidence": 0.92,
    "service_used": "gemini",
    "fallback_used": false,
    "care_guide_available": true,
    "report_available": true
  }
}
```

### Frontend Changes

#### Updated Service: `frontend/src/services/scanProcessor.ts`

The scan processor now implements a smart fallback strategy:

1. **Primary**: Try Green-Sense `/analyze-plant` endpoint
2. **Fallback**: If Green-Sense fails, fall back to old `/diagnose` endpoint (TFLite)

This ensures backward compatibility and reliability.

#### Updated Types: `frontend/src/types/scan.ts`

Added `PlantAnalysisResponse` interface to support the comprehensive Green-Sense response structure.

#### Updated Screen: `frontend/src/screens/ScanResultScreen.tsx`

Enhanced to display Green-Sense analysis information:
- Shows which service was used (Gemini, PlantID, PlantNet, or TFLite)
- Indicates if fallback service was used
- Displays care guide availability
- Shows PDF report generation status
- Adds "View PDF Report" button when report is available

## Environment Configuration

### Backend `.env` File

```env
# Required - For plant identification and image validation
GEMINI_API_KEY=AQ.Ab8RN6J3eD4a5OkwpIfMuxPTpHNPbEZv_wgvxTmuPZB-nwQTeQ

# Optional - For enhanced plant identification
PLANTID_API_KEY=your_plantid_api_key_here

# Optional - Additional fallback
PLANTNET_API_KEY=your_plantnet_api_key_here
```

**Note**: 
- GEMINI_API_KEY is required for the Green-Sense system to work
- PLANTID_API_KEY and PLANTNET_API_KEY are optional but provide additional fallback options
- If only Gemini is configured, the system will work with just that one service

## Dependencies

### New Backend Dependencies

Added to `backend/requirements.txt`:
- `requests>=2.31.0` - For making HTTP requests to external APIs
- `reportlab>=4.0.0` - For PDF report generation

Install with:
```bash
cd backend
pip install -r requirements.txt
```

## API Keys Setup

### Getting API Keys

1. **Gemini API Key** (Required):
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Add to `backend/.env` as `GEMINI_API_KEY`

2. **PlantID API Key** (Optional):
   - Visit: https://plant.id/
   - Sign up and get API key
   - Add to `backend/.env` as `PLANTID_API_KEY`

3. **PlantNet API Key** (Optional):
   - Visit: https://my-api.plantnet.org/
   - Sign up and get API key
   - Add to `backend/.env` as `PLANTNET_API_KEY`

## Testing the Integration

### 1. Start the Backend Server

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test the New Endpoint

```bash
# Using curl
curl -X POST "http://localhost:8000/api/v1/reports/analyze-plant" \
  -F "file=@test_plant_image.jpg"

# Or using the Swagger UI
# Visit: http://localhost:8000/docs
# Navigate to POST /api/v1/reports/analyze-plant
```

### 3. Test the Frontend

```bash
cd frontend
npm start
```

Upload a plant image and verify:
- Image validation occurs
- Plant is identified
- Care recommendations are generated
- PDF report is created
- Results are displayed correctly in ScanResultScreen

## Fallback Behavior

The system is designed with multiple fallback layers:

### Backend Fallback Chain
1. Try Gemini for image validation
2. Try Gemini for plant identification
3. If Gemini fails, try PlantID
4. If PlantID fails, try PlantNet
5. If all fail, return error with details

### Frontend Fallback Chain
1. Try Green-Sense `/analyze-plant` endpoint
2. If it fails, fall back to TFLite `/diagnose` endpoint
3. If both fail, show error to user

This ensures the app always works, even if external APIs are down.

## Benefits of Green-Sense Integration

1. **No Local Model Required**: Eliminates the need for TFLite models on the device
2. **Better Accuracy**: Uses advanced AI models (Gemini) for identification
3. **Comprehensive Analysis**: Provides care guides, treatment plans, and PDF reports
4. **Multi-Service Reliability**: Automatic fallback ensures high availability
5. **Scalable**: Easy to add new identification services
6. **Professional Reports**: PDF reports for farmers and agricultural officers

## Demo Day Preparation

For the demo next week:

1. **Ensure API Keys are Set**: Verify all API keys in `backend/.env`
2. **Test with Sample Images**: Test with various plant images (cassava, banana, etc.)
3. **Verify Fallback**: Temporarily disable one API to test fallback behavior
4. **Check PDF Generation**: Verify PDFs are generated correctly
5. **Monitor API Usage**: Keep track of API calls to avoid rate limits
6. **Prepare Backup**: Have the old TFLite system ready as ultimate fallback

## Troubleshooting

### Issue: "Image does not appear to contain a plant"
- **Solution**: Ensure the image is clear and shows a plant leaf/flower/stem
- Check Gemini API key is valid
- Verify internet connectivity

### Issue: "Could not identify plant species"
- **Solution**: All identification services failed
- Check API keys for PlantID and PlantNet
- Verify Gemini API key has quota remaining
- Try a clearer image

### Issue: PDF report not generating
- **Solution**: Check that reportlab is installed
- Verify write permissions to `backend/reports/` directory
- Check server logs for errors

### Issue: Frontend shows TFLite results instead of Green-Sense
- **Solution**: Green-Sense endpoint failed, check backend logs
- Verify backend server is running
- Check network connectivity from device to backend

## Performance Considerations

- **API Latency**: Each external API call takes 2-5 seconds
- **Total Analysis Time**: 10-20 seconds for complete pipeline
- **Caching**: Consider implementing caching for repeated analyses
- **Rate Limits**: Monitor API rate limits (especially for free tiers)
- **Offline Mode**: Frontend still works offline with local TFLite fallback

## Security Notes

- API keys are stored in `.env` (never commit to git)
- All API calls are made server-side (keys never exposed to frontend)
- Images are temporarily stored and deleted after processing
- PDF reports are stored on server (consider cleanup strategy)

## Next Steps

1. Add more plant identification services as needed
2. Implement caching to reduce API calls
3. Add user accounts to save analysis history
4. Implement PDF download/sharing functionality
5. Add batch processing for multiple images
6. Integrate with disease database for more specific treatment plans