import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function ProfileDetailsScreen({ navigation }) {
  const { user, updateProfile, submitKyc } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bvn, setBvn] = useState(user?.bvn || '');
  const [nin, setNin] = useState(user?.nin || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const result = await updateProfile({ firstName, lastName });
    setIsSaving(false);

    if (result.success) {
      Alert.alert('Profile updated', 'Your profile details were saved successfully.');
    } else {
      Alert.alert('Update failed', result.error);
    }
  };

  const handleSubmitKyc = async () => {
    if (!bvn && !nin) {
      Alert.alert('KYC required', 'Enter your BVN or NIN to continue.');
      return;
    }

    setIsSubmittingKyc(true);
    const result = await submitKyc({ bvn, nin });
    setIsSubmittingKyc(false);

    if (result.success) {
      Alert.alert('KYC updated', result.message);
    } else {
      Alert.alert('KYC failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={user?.email || ''}
            editable={false}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={user?.phone || ''}
            editable={false}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.primaryButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.sectionTitle}>KYC</Text>
              <Text style={styles.statusText}>
                {user?.kycVerified ? 'Verified' : `Level ${user?.kycLevel || 0}`}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: user?.kycVerified ? colors.successSoft : colors.primarySoft }]}>
              <Text style={[styles.badgeText, { color: user?.kycVerified ? colors.success : colors.primary }]}>
                {user?.kycVerified ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>BVN</Text>
          <TextInput
            style={styles.input}
            value={bvn}
            onChangeText={setBvn}
            placeholder="11-digit BVN"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={11}
          />

          <Text style={styles.label}>NIN</Text>
          <TextInput
            style={styles.input}
            value={nin}
            onChangeText={setNin}
            placeholder="11-digit NIN"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={11}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmitKyc}
            disabled={isSubmittingKyc}
          >
            {isSubmittingKyc ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.primaryButtonText}>Submit KYC</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: 16,
      paddingBottom: 16
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text
    },
    placeholder: {
      width: 40
    },
    scrollView: {
      flex: 1
    },
    content: {
      padding: 16,
      gap: 16
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12
    },
    label: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 6
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 12
    },
    readOnlyInput: {
      opacity: 0.75
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4
    },
    primaryButtonText: {
      color: colors.black,
      fontSize: 15,
      fontWeight: '700'
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    statusText: {
      color: colors.textMuted
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700'
    }
  });
