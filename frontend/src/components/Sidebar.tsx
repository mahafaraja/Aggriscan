import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { 
  Home, 
  ChartSquare, 
  Settings, 
  User, 
  Logout 
} from 'iconsax-react-native';
import { theme } from '../theme/Index';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: 'Home' | 'Statistics' | 'Settings' | 'AccountInfo') => void;
  onLogout: () => void;
}

function Sidebar({ visible, onClose, onNavigate, onLogout }: SidebarProps) {
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigate = (screen: 'Home' | 'Statistics' | 'Settings' | 'AccountInfo') => {
    onNavigate(screen);
    onClose();
  };

  return (
    <Animated.View 
      style={[
        styles.overlay,
        visible && styles.overlayVisible
      ]}
    >
      <TouchableOpacity 
        style={styles.overlayTouchable} 
        onPress={onClose}
        activeOpacity={1}
      />
      
      <Animated.View 
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Agriscan</Text>
            <Text style={styles.headerSubtitle}>Mobile Diagnostics</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={40} color={theme.colors.textOnDark} variant="Bold" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>Agriscan User</Text>
            <Text style={styles.userPhone}>+256 700 000 000</Text>
          </View>
        </View>

        {/* Navigation Menu */}
        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigate('Home')}
          >
            <Home size={24} color={theme.colors.mint} variant="Bold" />
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigate('Statistics')}
          >
            <ChartSquare size={24} color={theme.colors.mint} variant="Bold" />
            <Text style={styles.menuText}>Statistics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigate('Settings')}
          >
            <Settings size={24} color={theme.colors.mint} variant="Bold" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => handleNavigate('AccountInfo')}
          >
            <User size={24} color={theme.colors.mint} variant="Bold" />
            <Text style={styles.menuText}>Account Info</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Logout size={24} color={theme.colors.error} variant="Bold" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default Sidebar;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  overlayVisible: {
    pointerEvents: 'auto',
  },
  overlayTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: theme.colors.darkTeal,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.mint,
    marginBottom: theme.spacing.sm / 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.mint,
    opacity: 0.8,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: theme.colors.textOnDark,
    fontWeight: '300',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.deepTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnDark,
    marginBottom: theme.spacing.sm / 2,
  },
  userPhone: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.mint,
    opacity: 0.8,
  },
  menu: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.input,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textOnDark,
    marginLeft: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.input,
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
    marginLeft: theme.spacing.md,
  },
});