import React, { useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { billsAPI } from '../../api/client';
import BillPinModal from '../../components/BillPinModal';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function CableScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('dstv');
  const [smartCardNumber, setSmartCardNumber] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    billsAPI
      .getProviders('cable')
      .then((response) => {
        const result = response.data.providers || [];
        setProviders(result);
        if (result[0]?.id) {
          setSelectedProvider((current) => current || result[0].id);
        }
      })
      .catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    if (!selectedProvider) return;
    setLoadingPackages(true);
    billsAPI
      .getCablePackages(selectedProvider)
      .then((response) => {
        setPackages(response.data.packages || []);
        setSelectedPackage(null);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoadingPackages(false));
  }, [selectedProvider]);

  const verifySmartCard = async () => {
    if (!selectedProvider || smartCardNumber.length < 10) return;
    setIsVerifying(true);
    try {
      const response = await billsAPI.validateSmartCard(selectedProvider, smartCardNumber);
      setCustomerInfo(response.data.customerInfo || null);
    } catch (error) {
      setCustomerInfo(null);
      Alert.alert('Validation failed', error.response?.data?.message || 'Unable to validate smart card number.');
    } finally {
      setIsVerifying(false);
    }
  };

  const openPinModal = () => {
    if (!smartCardNumber || smartCardNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid smart card number');
      return;
    }
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a package');
      return;
    }
    setShowPinModal(true);
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await billsAPI.payCable({
        provider: selectedProvider,
        smartCardNumber,
        packageId: selectedPackage.id,
        pin
      });
      await fetchUserProfile();
      setShowPinModal(false);
      setPin('');
      Alert.alert('Subscription successful', response.data.message || 'Cable subscription successful', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Subscription failed', error.response?.data?.message || 'Unable to complete cable subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cable TV</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>N{Number(user?.balances?.NGN || 0).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionLabel}>Select Provider</Text>
        <View style={styles.providersRow}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={[
                styles.providerCard,
                selectedProvider === provider.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedProvider(provider.id)}
            >
              <View style={[styles.providerIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="tv" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.providerName, selectedProvider === provider.id && { color: colors.primary }]}>
                {provider.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Smart Card / IUC Number</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.cardInput}
            value={smartCardNumber}
            onChangeText={(value) => {
              setSmartCardNumber(value.replace(/\D/g, '').slice(0, 17));
              setCustomerInfo(null);
            }}
            keyboardType="number-pad"
            placeholder="Enter smart card number"
            placeholderTextColor={colors.textMuted}
            maxLength={17}
          />
          {isVerifying ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
        <TouchableOpacity style={styles.verifyButton} onPress={verifySmartCard} disabled={isVerifying}>
          <Text style={styles.verifyButtonText}>Validate smart card</Text>
        </TouchableOpacity>

        {customerInfo ? (
          <View style={styles.customerCard}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerInfo.name}</Text>
              <Text style={styles.customerDetail}>Current: {customerInfo.currentPackage}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Select Package</Text>
        {loadingPackages ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.packagesList}>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, selectedPackage?.id === pkg.id && styles.packageCardActive]}
                onPress={() => setSelectedPackage(pkg)}
              >
                <View style={styles.packageLeft}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                </View>
                <View style={styles.packageRight}>
                  <Text style={styles.packageAmount}>N{pkg.amount.toLocaleString()}</Text>
                </View>
                {selectedPackage?.id === pkg.id ? (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedPackage ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Subscription Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider</Text>
              <Text style={styles.summaryValue}>{providers.find((p) => p.id === selectedProvider)?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package</Text>
              <Text style={styles.summaryValue}>{selectedPackage.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>N{selectedPackage.amount.toLocaleString()}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            (!smartCardNumber || !selectedPackage || smartCardNumber.length < 10) && styles.subscribeBtnDisabled
          ]}
          onPress={openPinModal}
          disabled={!smartCardNumber || !selectedPackage || smartCardNumber.length < 10}
        >
          <Text style={styles.subscribeBtnText}>
            {selectedPackage ? `Pay N${selectedPackage.amount.toLocaleString()}` : 'Select Package'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BillPinModal
        visible={showPinModal}
        pin={pin}
        setPin={setPin}
        loading={isLoading}
        onConfirm={handleSubscribe}
        onClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
        subtitle="Authorize your cable subscription"
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    placeholder: { width: 40 },
    scrollView: { flex: 1, padding: 16 },
    balanceCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    balanceLabel: { color: colors.textMuted },
    balanceValue: { color: colors.success, fontSize: 24, fontWeight: '700', marginTop: 6 },
    sectionLabel: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 12 },
    providersRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    providerCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, width: '30%', borderWidth: 1, borderColor: colors.border },
    providerIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    providerName: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardInput: { flex: 1, fontSize: 18, color: colors.text },
    verifyButton: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 16 },
    verifyButtonText: { color: colors.primary, fontWeight: '700' },
    customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successSoft, padding: 14, borderRadius: 12, marginBottom: 20, gap: 12 },
    customerInfo: { flex: 1 },
    customerName: { fontSize: 15, fontWeight: '500', color: colors.success },
    customerDetail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    packagesList: { marginBottom: 20 },
    packageCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    packageCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    packageLeft: { flex: 1 },
    packageName: { fontSize: 16, fontWeight: '600', color: colors.text },
    packageRight: { alignItems: 'flex-end' },
    packageAmount: { fontSize: 16, fontWeight: '700', color: colors.primary },
    checkmark: { marginLeft: 8 },
    summaryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    summaryTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    summaryLabel: { fontSize: 13, color: colors.textMuted },
    summaryValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
    subscribeBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
    subscribeBtnDisabled: { opacity: 0.6 },
    subscribeBtnText: { color: colors.black, fontSize: 16, fontWeight: '700' }
  });
