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
import { cleanPhoneNumber, formatPhoneNumber } from '../../lib/bills';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function DataScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    billsAPI
      .getProviders('data')
      .then((response) => {
        const providers = response.data.providers || [];
        setNetworks(providers);
        if (providers[0]?.id) {
          setSelectedNetwork((current) => current || providers[0].id);
        }
      })
      .catch(() => setNetworks([]));
  }, []);

  useEffect(() => {
    if (!selectedNetwork) return;
    setLoadingPlans(true);
    billsAPI
      .getDataPlans(selectedNetwork)
      .then((response) => {
        setPlans(response.data.plans || []);
        setSelectedPlan(null);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, [selectedNetwork]);

  const openPinModal = () => {
    const cleanedNumber = cleanPhoneNumber(phoneNumber);
    if (cleanedNumber.length !== 11) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a data plan');
      return;
    }
    setShowPinModal(true);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const response = await billsAPI.buyData({
        provider: selectedNetwork,
        phoneNumber: cleanPhoneNumber(phoneNumber),
        planId: selectedPlan.id,
        pin
      });
      await fetchUserProfile();
      setShowPinModal(false);
      setPin('');
      Alert.alert('Success', response.data.message || 'Data purchase successful', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Purchase failed', error.response?.data?.message || 'Unable to buy data.');
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
        <Text style={styles.headerTitle}>Buy Data</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>N{Number(user?.balances?.NGN || 0).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionLabel}>Select Network</Text>
        <View style={styles.networksRow}>
          {networks.map((network) => (
            <TouchableOpacity
              key={network.id}
              style={[
                styles.networkCard,
                selectedNetwork === network.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedNetwork(network.id)}
            >
              <View style={[styles.networkIcon, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.networkInitial, { color: colors.primary }]}>
                  {network.name.charAt(0)}
                </Text>
              </View>
              <Text style={[styles.networkName, selectedNetwork === network.id && { color: colors.primary }]}>
                {network.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.phonePrefix}>+234</Text>
          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
            keyboardType="phone-pad"
            placeholder="80X XXX XXXX"
            placeholderTextColor={colors.textMuted}
            maxLength={13}
          />
        </View>

        <Text style={styles.sectionLabel}>Select Data Plan</Text>
        {loadingPlans ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.plansGrid}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, selectedPlan?.id === plan.id && styles.planCardActive]}
                onPress={() => setSelectedPlan(plan)}
              >
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planAmount}>N{plan.amount.toLocaleString()}</Text>
                <Text style={styles.planValidity}>{plan.validity}</Text>
                {selectedPlan?.id === plan.id ? (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedPlan ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transaction Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Data Plan</Text>
              <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>N{selectedPlan.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Validity</Text>
              <Text style={styles.summaryValue}>{selectedPlan.validity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phone</Text>
              <Text style={styles.summaryValue}>+234 {phoneNumber || '...'}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.purchaseBtn,
            (!phoneNumber || !selectedPlan || cleanPhoneNumber(phoneNumber).length !== 11) && styles.purchaseBtnDisabled
          ]}
          onPress={openPinModal}
          disabled={!phoneNumber || !selectedPlan || cleanPhoneNumber(phoneNumber).length !== 11}
        >
          <Text style={styles.purchaseBtnText}>
            {selectedPlan ? `Buy for N${selectedPlan.amount.toLocaleString()}` : 'Select a Plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BillPinModal
        visible={showPinModal}
        pin={pin}
        setPin={setPin}
        loading={isLoading}
        onConfirm={handlePurchase}
        onClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
        subtitle="Authorize your data bundle purchase"
      />
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
      flex: 1,
      padding: 16
    },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    balanceLabel: {
      color: colors.textMuted
    },
    balanceValue: {
      color: colors.success,
      fontSize: 24,
      fontWeight: '700',
      marginTop: 6
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12
    },
    networksRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20
    },
    networkCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      width: '23%',
      borderWidth: 1,
      borderColor: colors.border
    },
    networkIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8
    },
    networkInitial: {
      fontSize: 18,
      fontWeight: '700'
    },
    networkName: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center'
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    phonePrefix: {
      fontSize: 16,
      color: colors.textMuted,
      marginRight: 8
    },
    phoneInput: {
      flex: 1,
      fontSize: 18,
      color: colors.text
    },
    plansGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20
    },
    planCard: {
      width: '30.5%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    planCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    planName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text
    },
    planAmount: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 4
    },
    planValidity: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4
    },
    checkmark: {
      position: 'absolute',
      top: 8,
      right: 8
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textMuted
    },
    summaryValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500'
    },
    purchaseBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 32
    },
    purchaseBtnDisabled: {
      opacity: 0.6
    },
    purchaseBtnText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '700'
    }
  });
