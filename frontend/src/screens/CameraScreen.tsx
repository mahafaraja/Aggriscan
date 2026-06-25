import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { processScanImage } from '../services/scanProcessor';
import { theme } from '../theme/Index';
import { ScanPayload } from '../types/scan';

interface CameraScreenProps {
  onNavigate: (screen: 'Home' | 'Camera' | 'History') => void;
  onScanComplete: (scan: ScanPayload) => void;
}

export default function CameraScreen({ onNavigate, onScanComplete }: CameraScreenProps) {
  // Use Expo's native hook for handling camera permissions seamlessly
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // Initialize permissions on component mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. Trigger modern camera permission sequence
        if (!cameraPermission?.granted) {
          await requestCameraPermission();
        }

        // 2. Trigger Foreground GPS permissions
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        const locationGranted = locationStatus.status === 'granted';
        setHasLocationPermission(locationGranted);

        // Warm up GPS sensor early if permission is granted
        if (locationGranted) {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            if (!cancelled) {
              setGpsCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
            }
          } catch (e) {
            console.warn("GPS warmup failed or timed out:", e);
          }
        }
      } catch (error) {
        console.error("Permission initialization failed:", error);
        if (!cancelled) {
          setHasLocationPermission(false);
        }
      } finally {
        if (!cancelled) {
          setPermissionsReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cameraPermission, requestCameraPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Capture snap-frame using the correct layout configuration
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error("Failed to capture image data URI");
      setCapturedImage(photo.uri);

      // 2. Fetch coordinate points
      let lat = 0.3476; // Kampala baseline fallback coordinates
      let lon = 32.5825;
      if (hasLocationPermission) {
        try {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = location.coords.latitude;
          lon = location.coords.longitude;
          setGpsCoords({ lat, lon });
        } catch (gpsErr) {
          console.warn("Could not fetch real-time GPS coordinates, falling back.", gpsErr);
        }
      }

      const scan = await processScanImage({
        imageUri: photo.uri,
        latitude: lat,
        longitude: lon,
      });
      onScanComplete(scan);

    } catch (error) {
      console.error("Diagnosis workflow failed:", error);
      alert("Error processing crop diagnosis.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Gracefully render state while permissions are being requested
  if (!permissionsReady || cameraPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.deepTeal} />
        <Text style={styles.loadingText}>Initializing camera and location drivers...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera access permission was denied.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Home')}>
          <Text style={styles.backBtnText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header controls */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('Home')}>
          <Text style={styles.iconText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AgriDiagnose Scanner</Text>
      </View>

      {/* Main viewport */}
      <View style={styles.viewport}>
        {!capturedImage ? (
          <CameraView style={styles.camera} ref={cameraRef}>
            <View style={styles.overlayContainer}>
              <View style={styles.targetFrame}>
                <Text style={styles.frameInstruction}>Align Leaf or Stem inside box</Text>
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.textOnDark} />
                <Text style={styles.processingText}>Processing local model inference...</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Lower triggers bar */}
      {!capturedImage && (
        <View style={styles.controlBar}>
          <View style={styles.gpsIndicator}>
            <Text style={styles.gpsText}>
              📍 GPS Accuracy: {gpsCoords ? 'Locked (WGS84)' : 'Searching...'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} disabled={isProcessing}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.deepTeal,
    fontWeight: '600',
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.error,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.darkTeal,
  },
  iconButton: {
    paddingRight: theme.spacing.md,
  },
  iconText: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
  },
  headerTitle: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
  },
  viewport: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: theme.colors.overlaySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: theme.colors.success,
    borderRadius: theme.radius.card,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.translucentSurface,
  },
  frameInstruction: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
    fontSize: theme.typography.caption.fontSize,
    backgroundColor: theme.colors.overlayStrong,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm / 2,
    borderRadius: theme.radius.input / 2,
    position: 'absolute',
    bottom: -theme.spacing.lg * 1.5,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: theme.colors.textOnDark,
    marginTop: theme.spacing.md,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.radius.screen,
    borderTopRightRadius: theme.radius.screen,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  resultsTitle: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm / 2,
  },
  diseaseLabel: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '800',
    color: theme.colors.darkTeal,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm / 2,
    borderRadius: theme.radius.input,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    overflow: 'hidden',
  },
  badgeHigh: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.error,
  },
  badgeLow: {
    backgroundColor: theme.colors.mint,
    color: theme.colors.deepTeal,
  },
  confidence: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm / 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  advisoryHeader: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  advisoryText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.caption.lineHeight,
  },
  advisoryTranslation: {
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
    color: theme.colors.deepTeal,
  },
  dismissBtn: {
    backgroundColor: theme.colors.deepTeal,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.input,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  dismissBtnText: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
    fontSize: theme.typography.body.fontSize,
  },
  controlBar: {
    backgroundColor: theme.colors.overlayDark,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  gpsIndicator: {
    marginBottom: theme.spacing.md,
  },
  gpsText: {
    color: theme.colors.mint,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
  },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: theme.radius.full,
    borderWidth: 4,
    borderColor: theme.colors.textOnDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.textOnDark,
  },
  backBtn: {
    backgroundColor: theme.colors.deepTeal,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.input,
  },
  backBtnText: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
}); 

