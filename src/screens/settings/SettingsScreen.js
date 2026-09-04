import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const buildMenu = (colors) => [
  {
    section: 'Account',
    items: [
      { id: 'profile', icon: 'person-outline', title: 'Profile', subtitle: 'Personal details and KYC', color: colors.accent },
      { id: 'email', icon: 'mail-outline', title: 'Email Verification', subtitle: 'Confirm your account email', color: colors.primary },
      { id: 'kyc', icon: 'shield-checkmark-outline', title: 'KYC Verification', subtitle: 'Complete identity verification', color: colors.success },
      { id: 'security', icon: 'shield-checkmark-outline', title: 'Security', subtitle: 'PIN, biometric, and protection', color: colors.success },
      { id: 'keys', icon: 'key-outline', title: 'Key Management', subtitle: 'Export recovery phrase and keys', color: colors.accent }
    ]
  },
  {
    section: 'Preferences',
    items: [
      { id: 'preferences', icon: 'color-palette-outline', title: 'Appearance & Currency', subtitle: 'Theme mode, currency, and language', color: colors.primary },
      { id: 'notifications', icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage notification channels', color: colors.accent }
    ]
  },
  {
    section: 'Support',
    items: [
      { id: 'help', icon: 'help-circle-outline', title: 'Help Center', subtitle: 'FAQs and product guidance', color: colors.primary },
      { id: 'contact', icon: 'mail-outline', title: 'Contact Us', subtitle: 'Reach the support team', color: colors.success },
      { id: 'about', icon: 'information-circle-outline', title: 'About', subtitle: 'Version and platform details', color: colors.textMuted }
    ]
  }
];

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateSecurityPreferences } = useAuthStore();
  const { clearWallets } = useWalletStore();
  const { colors, themeMode, setThemeMode, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const menu = useMemo(() => buildMenu(colors), [colors]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUpdatingBiometric, setIsUpdatingBiometric] = useState(false);
  const biometricEnabled = Boolean(user?.biometricEnabled);

  const cycleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'system' : 'dark';
    setThemeMode(next);
  };

  const themeIcon = themeMode === 'dark' ? 'moon' : themeMode === 'light' ? 'sunny' : 'phone-portrait';

  const handleMenuPress = (id) => {
    switch (id) {
      case 'profile':
        navigation.navigate('ProfileDetails');
        break;
      case 'email':
        navigation.navigate('EmailVerification');
        break;
      case 'kyc':
        navigation.navigate('Kyc');
        break;
      case 'security':
        navigation.navigate('SecuritySettings');
        break;
      case 'keys':
        navigation.navigate('KeyManagement');
        break;
      case 'preferences':
        navigation.navigate('Preferences');
        break;
      case 'notifications':
        navigation.navigate('NotificationSettings');
        break;
      case 'help':
      case 'contact':
      case 'about':
        navigation.navigate('InfoDetails', { type: id });
        break;
      default:
        break;
    }
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);
    await clearWallets();
    await logout();
  };

  const toggleBiometric = async (value) => {
    setIsUpdatingBiometric(true);
    const result = await updateSecurityPreferences({ biometricEnabled: value });
    setIsUpdatingBiometric(false);

  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={cycleTheme}>
          <Ionicons name={themeIcon} size={18} color={colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.profileContent} onPress={() => handleMenuPress('profile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.username ? `@${user.username}` : `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
              </Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <View style={styles.profileMeta}>
                <Text style={styles.profileMetaText}>
                  KYC {user?.kycVerified ? 'verified' : 'pending'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.biometricCard}>
          <View style={styles.biometricLeft}>
            <Ionicons name="finger-print-outline" size={24} color={colors.primary} />
            <View>
              <Text style={styles.biometricTitle}>Biometric Login</Text>
              <Text style={styles.biometricSubtitle}>Use device biometrics when enabled</Text>
            </View>
          </View>
          {isUpdatingBiometric ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          )}
        </View>

        {menu.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item.id)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}22` }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>FlameX v1.0.0</Text>
      </ScrollView>

      <Modal transparent visible={showLogoutModal} animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmLogout}>
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text
    },
    themeToggle: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primarySoft,
      borderWidth: 1, borderColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    scrollView: {
      flex: 1
    },
    content: {
      flexGrow: 1,
      paddingBottom: 120
    },
    profileCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    profileContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primarySoft,
      borderWidth: 1.5,
      borderColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center'
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primary
    },
    profileInfo: {
      flex: 1,
      marginLeft: 16
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text
    },
    profileEmail: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2
    },
    profileMeta: {
      marginTop: 6
    },
    profileMetaText: {
      fontSize: 12,
      color: colors.success
    },
    biometricCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    biometricLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    biometricTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text
    },
    biometricSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2
    },
    section: {
      marginBottom: 16
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginHorizontal: 16,
      marginBottom: 8
    },
    sectionContent: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center'
    },
    menuText: {
      flex: 1,
      marginLeft: 12
    },
    menuTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text
    },
    menuSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.dangerSoft,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      padding: 14,
      borderRadius: 12,
      gap: 8
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.danger
    },
    versionText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 24
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modalBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      marginHorizontal: 32,
      width: '85%',
      borderWidth: 1,
      borderColor: colors.border
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8
    },
    modalMessage: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 24
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12
    },
    modalCancel: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center'
    },
    modalCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text
    },
    modalConfirm: {
      flex: 1,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.danger,
      alignItems: 'center'
    },
    modalConfirmText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#fff'
    }
  });
