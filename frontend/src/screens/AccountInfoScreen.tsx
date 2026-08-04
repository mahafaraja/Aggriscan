import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, Image } from 'react-native';
import { User, Camera } from 'iconsax-react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/Index';

interface AccountInfoScreenProps {
  onBack: () => void;
}

function AccountInfoScreen({ onBack }: AccountInfoScreenProps) {
  const [phone, setPhone] = React.useState<string>('');
  const [userName, setUserName] = React.useState<string>('');
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState<string>('');

  React.useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userPhone = await SecureStore.getItemAsync('user_phone');
      const name = await SecureStore.getItemAsync('user_name');
      const profilePic = await SecureStore.getItemAsync('profile_image');
      
      if (userPhone) setPhone(userPhone);
      if (name) {
        setUserName(name);
        setEditedName(name);
      }
      if (profilePic) setProfileImage(profilePic);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      await SecureStore.setItemAsync('user_name', editedName.trim());
      setUserName(editedName.trim());
      setIsEditing(false);
      Alert.alert('Success', 'Profile name updated successfully');
    } catch (error) {
      console.error('Error saving name:', error);
      Alert.alert('Error', 'Could not save name. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await SecureStore.setItemAsync('profile_image', imageUri);
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not upload profile picture. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Account Information</Text>
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <User size={60} color={theme.colors.textOnDark} variant="Bold" />
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
            <Camera size={20} color={theme.colors.textOnDark} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>{userName || 'Agriscan User'}</Text>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>
              {phone ? `+${phone.slice(0, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}` : 'Not available'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>Standard User</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Display Name</Text>
            {isEditing ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameDisplayContainer}>
                <Text style={styles.infoValue}>{userName || 'Not set'}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>Free Plan</Text>
              <View style={styles.subscriptionBadge}>
                <Text style={styles.subscriptionBadgeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.subscriptionDescription}>
              Unlimited scans with basic features
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Usage Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage This Month</Text>
          
          <View style={styles.usageCard}>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Scans Performed</Text>
              <Text style={styles.usageValue}>24</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>Data Synced</Text>
              <Text style={styles.usageValue}>18 MB</Text>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>Help Center</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>Contact Support</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>Report a Bug</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

export default AccountInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  backIcon: {
    fontSize: 28,
    color: theme.colors.deepTeal,
    fontWeight: '300',
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.darkTeal,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.deepTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.mint,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.input,
    marginBottom: theme.spacing.md,
  },
  changePhotoText: {
    color: theme.colors.deepTeal,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    marginLeft: theme.spacing.sm / 2,
  },
  avatarLabel: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkTeal,
  },
  section: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkTeal,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.deepTeal,
  },
  editNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  nameInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.deepTeal,
    fontSize: theme.typography.body.fontSize,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.input,
  },
  saveButtonText: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
    fontSize: theme.typography.caption.fontSize,
  },
  nameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  editButton: {
    backgroundColor: theme.colors.mint,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.input,
  },
  editButtonText: {
    color: theme.colors.deepTeal,
    fontWeight: '700',
    fontSize: theme.typography.caption.fontSize,
  },
  subscriptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.mint,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  subscriptionTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.deepTeal,
  },
  subscriptionBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm / 2,
    borderRadius: theme.radius.full,
  },
  subscriptionBadgeText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.textOnDark,
  },
  subscriptionDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  upgradeButton: {
    backgroundColor: theme.colors.deepTeal,
    borderRadius: theme.radius.input,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: theme.colors.textOnDark,
  },
  usageCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usageItem: {
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  usageValue: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.deepTeal,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.mint,
  },
  actionText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.deepTeal,
  },
  actionArrow: {
    fontSize: 24,
    color: theme.colors.deepTeal,
    fontWeight: '300',
  },
});