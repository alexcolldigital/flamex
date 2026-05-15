import React, { useMemo, useState } from 'react';
import {
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
import { p2pAPI } from '../../api/client';
import { P2P_ASSETS, P2P_SIDE_META } from '../../lib/p2p';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function P2PCreateOfferScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [side, setSide] = useState('sell');
  const [asset, setAsset] = useState('USDT');
  const [price, setPrice] = useState('');
  const [availableAmount, setAvailableAmount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxOrderAmount, setMaxOrderAmount] = useState('');
  const [paymentWindowMinutes, setPaymentWindowMinutes] = useState('30');
  const [region, setRegion] = useState('NG');
  const [merchantOnly, setMerchantOnly] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(false);

  const createOffer = async () => {
    if (!price || !availableAmount || !minOrderAmount || !maxOrderAmount) {
      Alert.alert('Error', 'Complete the offer pricing and amount fields.');
      return;
    }

    setLoading(true);
    try {
      await p2pAPI.createOffer({
        side,
        asset,
        price: Number(price),
        availableAmount: Number(availableAmount),
        minOrderAmount: Number(minOrderAmount),
        maxOrderAmount: Number(maxOrderAmount),
        paymentWindowMinutes: Number(paymentWindowMinutes || 30),
        paymentMethods: ['bank_transfer'],
        paymentMethod: 'bank_transfer',
        region,
        merchantOnly,
        paymentDetails: {
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          accountName: accountName || null,
          instructions: instructions || null
        },
        terms
      });
      Alert.alert('Offer created', 'Your P2P offer is now live.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Create offer failed', error.response?.data?.message || 'Unable to create offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create P2P Offer</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{P2P_SIDE_META[side].title}</Text>
          <Text style={styles.heroText}>{P2P_SIDE_META[side].subtitle}</Text>
        </View>

        <Text style={styles.label}>Side</Text>
        <View style={styles.segmentRow}>
          {['sell', 'buy'].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.segmentButton, side === value && styles.segmentButtonActive]}
              onPress={() => setSide(value)}
            >
              <Text style={[styles.segmentText, side === value && styles.segmentTextActive]}>{value.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Asset</Text>
        <View style={styles.assetRow}>
          {P2P_ASSETS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.assetChip, asset === item && styles.assetChipActive]}
              onPress={() => setAsset(item)}
            >
              <Text style={[styles.assetChipText, asset === item && styles.assetChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Region</Text>
        <TextInput
          style={styles.input}
          value={region}
          onChangeText={(value) => setRegion((value || 'NG').toUpperCase())}
          placeholder="NG"
          placeholderTextColor={colors.textMuted}
          maxLength={3}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Buyer access</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentButton, !merchantOnly && styles.segmentButtonActive]}
            onPress={() => setMerchantOnly(false)}
          >
            <Text style={[styles.segmentText, !merchantOnly && styles.segmentTextActive]}>All verified users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, merchantOnly && styles.segmentButtonActive]}
            onPress={() => setMerchantOnly(true)}
          >
            <Text style={[styles.segmentText, merchantOnly && styles.segmentTextActive]}>Merchant only</Text>
          </TouchableOpacity>
        </View>

        {[
          ['Rate (NGN per coin)', price, setPrice],
          ['Available amount', availableAmount, setAvailableAmount],
          ['Minimum order amount', minOrderAmount, setMinOrderAmount],
          ['Maximum order amount', maxOrderAmount, setMaxOrderAmount],
          ['Payment window in minutes', paymentWindowMinutes, setPaymentWindowMinutes],
          ['Bank name (recommended for sell offers)', bankName, setBankName],
          ['Account number', accountNumber, setAccountNumber],
          ['Account name', accountName, setAccountName],
          ['Payment instructions', instructions, setInstructions],
          ['Terms', terms, setTerms]
        ].map(([label, value, setter]) => (
          <View key={label}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setter}
              placeholder={label}
              placeholderTextColor={colors.textMuted}
              keyboardType={label.includes('amount') || label.includes('Rate') || label.includes('minutes') || label.includes('number') ? 'numeric' : 'default'}
              multiline={label === 'Payment instructions' || label === 'Terms'}
            />
          </View>
        ))}

        <TouchableOpacity style={[styles.primaryButton, loading && styles.disabledButton]} onPress={createOffer} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Creating offer...' : 'Publish offer'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    placeholder: { width: 40 },
    scrollView: { flex: 1, padding: 16 },
    heroCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    heroTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    heroText: { color: colors.textMuted, marginTop: 6, lineHeight: 20 },
    label: { color: colors.text, fontWeight: '600', marginBottom: 8, marginTop: 10 },
    segmentRow: { flexDirection: 'row', gap: 10 },
    segmentButton: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 12, alignItems: 'center' },
    segmentButtonActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    segmentText: { color: colors.textMuted, fontWeight: '700' },
    segmentTextActive: { color: colors.black },
    assetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    assetChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    assetChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    assetChipText: { color: colors.textMuted, fontWeight: '700' },
    assetChipTextActive: { color: colors.black },
    input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.text, paddingHorizontal: 14, paddingVertical: 12 },
    primaryButton: { marginTop: 24, marginBottom: 24, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
    primaryButtonText: { color: colors.black, fontWeight: '700', fontSize: 16 },
    disabledButton: { opacity: 0.6 }
  });
