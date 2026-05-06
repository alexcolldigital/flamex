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

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export default function BettingScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    billsAPI
      .getProviders('betting')
      .then((response) => setPlatforms(response.data.providers || []))
      .catch(() => setPlatforms([]));
  }, []);

  const minimumAmount = platforms.find((item) => item.id === selectedPlatform)?.minAmount || 100;

  const openPinModal = () => {
    if (!selectedPlatform) {
      Alert.alert('Error', 'Please select a betting platform');
      return;
    }
    if (!accountId || accountId.length < 3) {
      Alert.alert('Error', 'Please enter a valid account ID');
      return;
    }
    if (!amount || Number(amount) < minimumAmount) {
      Alert.alert('Error', `Minimum deposit is N${minimumAmount}`);
      return;
    }
    setShowPinModal(true);
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      const response = await billsAPI.payBetting({
        provider: selectedPlatform,
        accountId,
        amount: Number(amount),
        pin
      });
      await fetchUserProfile();
      setShowPinModal(false);
      setPin('');
      Alert.alert('Deposit successful', response.data.message || 'Betting deposit successful', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Deposit failed', error.response?.data?.message || 'Unable to complete betting deposit.');
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
        <Text style={styles.headerTitle}>Betting Deposit</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>N{Number(user?.balances?.NGN || 0).toLocaleString()}</Text>
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color={colors.primary} />
          <Text style={styles.warningTitle}>Gambling Warning</Text>
          <Text style={styles.warningText}>
            Please gamble responsibly. Set limits and never bet more than you can afford to lose.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Select Platform</Text>
        <View style={styles.platformsGrid}>
          {platforms.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                selectedPlatform === platform.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedPlatform(platform.id)}
            >
              <View style={[styles.platformIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="football" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.platformName, selectedPlatform === platform.id && { color: colors.primary }]}>
                {platform.name}
              </Text>
              <Text style={styles.platformMin}>Min: N{platform.minAmount}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Account ID / User ID</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.accountInput}
            value={accountId}
            onChangeText={setAccountId}
            placeholder="Enter your betting account ID"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.sectionLabel}>Amount (N)</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>N</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickAmountBtn, amount === amt.toString() && styles.quickAmountBtnActive]}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={[styles.quickAmountText, amount === amt.toString() && styles.quickAmountTextActive]}>
                N{amt.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {amount && selectedPlatform ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Deposit Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform</Text>
              <Text style={styles.summaryValue}>{platforms.find((p) => p.id === selectedPlatform)?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Account ID</Text>
              <Text style={styles.summaryValue}>{accountId}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>N{Number(amount || 0).toLocaleString()}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.depositBtn,
            (!selectedPlatform || !accountId || !amount) && styles.depositBtnDisabled
          ]}
          onPress={openPinModal}
          disabled={!selectedPlatform || !accountId || !amount}
        >
          <Text style={styles.depositBtnText}>Deposit Funds</Text>
        </TouchableOpacity>
      </ScrollView>

      <BillPinModal
        visible={showPinModal}
        pin={pin}
        setPin={setPin}
        loading={isLoading}
        onConfirm={handleDeposit}
        onClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
        subtitle="Authorize your betting deposit"
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
    warningCard: { backgroundColor: colors.primarySoft, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
    warningTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 8 },
    warningText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
    sectionLabel: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 12 },
    platformsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    platformCard: { width: '23%', backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    platformIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    platformName: { fontSize: 11, fontWeight: '500', color: colors.text, textAlign: 'center' },
    platformMin: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    inputContainer: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 20, justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    accountInput: { fontSize: 16, color: colors.text },
    amountInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    currencySymbol: { fontSize: 20, fontWeight: '700', color: colors.primary, marginRight: 8 },
    amountInput: { flex: 1, fontSize: 24, color: colors.text, fontWeight: '600' },
    quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    quickAmountBtn: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    quickAmountBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    quickAmountText: { fontSize: 14, color: colors.textMuted },
    quickAmountTextActive: { color: colors.primary, fontWeight: '600' },
    summaryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    summaryTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    summaryLabel: { fontSize: 13, color: colors.textMuted },
    summaryValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
    depositBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    depositBtnDisabled: { opacity: 0.6 },
    depositBtnText: { color: colors.black, fontSize: 16, fontWeight: '700' }
  });
