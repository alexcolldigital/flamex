import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../theme/ThemeProvider';

export default function KycScreen({ navigation }) {
  const { user, submitKyc } = useAuthStore();
  const { colors } = useAppTheme();
  const [bvn, setBvn] = useState(user?.bvn || '');
  const [nin, setNin] = useState(user?.nin || '');
  const [loading, setLoading] = useState(false);

  const validateInput = () => {
    if (!bvn && !nin) {
      Alert.alert('Error', 'Please enter either your BVN or NIN to continue.');
      return false;
    }

    if (bvn && bvn.length !== 11) {
      Alert.alert('Error', 'BVN must be 11 digits');
      return false;
    }

    if (nin && nin.length !== 11) {
      Alert.alert('Error', 'NIN must be 11 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;
    setLoading(true);

    try {
      const result = await submitKyc({ bvn, nin });
      if (!result.success) {
        throw new Error(result.error || 'Unable to submit KYC');
      }

      Alert.alert('Success', 'KYC submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'KYC submission failed');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.iconSection}>
          <View style={styles.iconWrapper}>
            <Icon name="shield-check" size={48} color="#FFB800" />
          </View>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>
            {user?.kycVerified
              ? 'Your account is already verified.'
              : 'Enter your BVN or NIN to complete the KYC process.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>BVN</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 11-digit BVN"
            placeholderTextColor="#666"
            value={bvn}
            onChangeText={(text) => setBvn(text.replace(/\D/g, '').slice(0, 11))}
            keyboardType="number-pad"
            maxLength={11}
          />

          <Text style={styles.label}>NIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 11-digit NIN"
            placeholderTextColor="#666"
            value={nin}
            onChangeText={(text) => setNin(text.replace(/\D/g, '').slice(0, 11))}
            keyboardType="number-pad"
            maxLength={11}
          />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit KYC'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20
  },
  contentContainer: {
    paddingBottom: 120
  },
  iconSection: {
    marginBottom: 24
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937'
  },
  label: {
    color: '#94a3b8',
    marginBottom: 8,
    fontSize: 13
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16
  },
  button: {
    backgroundColor: '#facc15',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.65
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16
  }
});


