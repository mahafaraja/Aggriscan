import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { AddCircle, ArrowLeft2, CloseCircle, GalleryAdd, Image as ImageIcon } from 'iconsax-react-native';
import { AuthBackground } from '../components';
import { processScanImage } from '../services/scanProcessor';
import { theme } from '../theme/Index';
import { ScanPayload } from '../types/scan';

interface AddPhotoScreenProps {
  onBack: () => void;
  onScanComplete: (scan: ScanPayload) => void;
}

export default function AddPhotoScreen({ onBack, onScanComplete }: AddPhotoScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pickImage = async () => {
    if (isProcessing) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Photo library permission is needed to add a crop image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const continueWithPhoto = async () => {
    if (!imageUri || isProcessing) return;
    setIsProcessing(true);

    try {
      let latitude = 0.3476;
      let longitude = 32.5825;

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        } catch (error) {
          console.warn('Add photo: GPS lookup failed, using Kampala fallback.', error);
        }
      }

      const scan = await processScanImage({ imageUri, latitude, longitude });
      onScanComplete(scan);
    } catch (error) {
      console.error('Add photo diagnosis failed:', error);
      alert('Could not process this photo. Please try another clear leaf image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" style={styles.iconButton} onPress={onBack}>
            <ArrowLeft2 size={22} color={theme.colors.darkTeal} variant="Linear" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.iconButton}
            onPress={() => (imageUri ? setImageUri(null) : onBack())}
          >
            <CloseCircle size={24} color={theme.colors.darkTeal} variant="Linear" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Add photos</Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.uploadBox, pressed && styles.pressed]}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.imageIconBox}>
                  <ImageIcon size={54} color="#FFFFFF" variant="Bold" />
                </View>
                <View style={styles.addBadge}>
                  <AddCircle size={28} color={theme.colors.deepTeal} variant="Bold" />
                </View>
              </View>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!imageUri || isProcessing}
            style={({ pressed }) => [
              styles.continueButton,
              (!imageUri || isProcessing) && styles.continueButtonDisabled,
              pressed && imageUri && !isProcessing && styles.pressed,
            ]}
            onPress={continueWithPhoto}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={theme.colors.darkTeal} />
            ) : (
              <>
                <GalleryAdd size={15} color={theme.colors.darkTeal} variant="Bold" />
                <Text style={styles.continueText}>CONTINUE</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    minHeight: 54,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 18,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    marginBottom: 68,
  },
  uploadBox: {
    width: 166,
    height: 210,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  emptyState: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIconBox: {
    width: 78,
    height: 78,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBadge: {
    position: 'absolute',
    right: -17,
    bottom: -17,
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  continueButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: 58,
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: '#70BD19',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  continueButtonDisabled: {
    opacity: 0.48,
  },
  continueText: {
    color: theme.colors.textOnDark,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});
