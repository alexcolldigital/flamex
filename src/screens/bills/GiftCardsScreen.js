import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { billsAPI } from '../../api/client';
import BillPinModal from '../../components/BillPinModal';
import { currencyFormatter } from '../../lib/finance';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const STATUS_COPY = {
  pending_review: { label: 'Pending Review', color: '#f59e0b' },
  more_info_required: { label: 'More Info Needed', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#22c55e' },
  rejected: { label: 'Rejected', color: '#ef4444' }
};

export default function GiftCardsScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [supportedCards, setSupportedCards] = useState([]);
  const [disclaimer, setDisclaimer] = useState('Final payout depends on card verification.');
  const [trades, setTrades] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [cardValue, setCardValue] = useState('');
  const [cardType, setCardType] = useState('physical');
  const [submissionMethod, setSubmissionMethod] = useState('images');
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [tradeCodePin, setTradeCodePin] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ratesResponse, tradesResponse] = await Promise.all([
        billsAPI.getGiftCardRates(),
        billsAPI.getGiftCardTrades()
      ]);
      setSupportedCards(ratesResponse.data.supportedCards || []);
      setDisclaimer(ratesResponse.data.disclaimer || 'Final payout depends on card verification.');
      setTrades(tradesResponse.data.trades || []);
    } catch (error) {
      console.log('Load gift card trade data error:', error);
      setSupportedCards([]);
      setTrades([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const selectedCard = useMemo(
    () => supportedCards.find((item) => `${item.brand}-${item.country}-${item.currency}` === selectedKey),
    [selectedKey, supportedCards]
  );

  const estimatedPayout = useMemo(() => {
    const value = Number(cardValue);
    if (!selectedCard || Number.isNaN(value) || value <= 0) return 0;
    return value * Number(selectedCard.ratePerUnit || 0);
  }, [cardValue, selectedCard]);

  const resetForm = () => {
    setCardValue('');
    setCardType('physical');
    setSubmissionMethod('images');
    setFrontImageUrl('');
    setBackImageUrl('');
    setCardCode('');
    setTradeCodePin('');
    setNote('');
    setPin('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    await loadData();
    setRefreshing(false);
  };

  const pickImage = async (side) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to attach gift card images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const imageValue = asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri;
    if (side === 'front') {
      setFrontImageUrl(imageValue);
    } else {
      setBackImageUrl(imageValue);
    }
  };

  const openPinModal = () => {
    if (!selectedCard) {
      Alert.alert('Missing details', 'Select a supported gift card first.');
      return;
    }
    if (!cardValue || Number(cardValue) <= 0) {
      Alert.alert('Missing amount', 'Enter the card value you want to trade.');
      return;
    }
    if (submissionMethod === 'images' && !frontImageUrl) {
      Alert.alert('Missing image', 'Upload at least the front image of the card.');
      return;
    }
    if (submissionMethod === 'code' && !cardCode.trim()) {
      Alert.alert('Missing code', 'Enter the gift card code to continue.');
      return;
    }
    setShowPinModal(true);
  };

  const submitTrade = async () => {
    if (!selectedCard) return;

    setLoading(true);
    try {
      const response = await billsAPI.submitGiftCardTrade({
        brand: selectedCard.brand,
        country: selectedCard.country,
        currency: selectedCard.currency,
        cardValue: Number(cardValue),
        cardType,
        submissionMethod,
        frontImageUrl: submissionMethod === 'images' ? frontImageUrl : '',
        backImageUrl: submissionMethod === 'images' ? backImageUrl : '',
        cardCode: submissionMethod === 'code' ? cardCode.trim() : '',
        tradeCodePin: submissionMethod === 'code' ? tradeCodePin.trim() : '',
        note: note.trim(),
        pin
      });

      await fetchUserProfile();
      await loadData();
      setShowPinModal(false);
      resetForm();
      Alert.alert(
        'Trade submitted',
        `Your trade is now ${response.data.trade?.status?.replace(/_/g, ' ') || 'pending review'}.`
      );
    } catch (error) {
      Alert.alert('Submission failed', error.response?.data?.message || 'Unable to submit gift card trade.');
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
        <Text style={styles.headerTitle}>Sell Gift Card</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>{currencyFormatter(Number(user?.balances?.NGN || 0), 'NGN')}</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Manual verification</Text>
            <Text style={styles.infoText}>{disclaimer}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Current rates</Text>
        <View style={styles.cardGrid}>
          {supportedCards.map((item) => {
            const key = `${item.brand}-${item.country}-${item.currency}`;
            const isSelected = selectedKey === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.rateCard, isSelected && styles.rateCardActive]}
                onPress={() => setSelectedKey(key)}
              >
                <Text style={[styles.rateTitle, isSelected && styles.rateTitleActive]}>
                  {item.brand} {item.country}
                </Text>
                <Text style={styles.rateSubtitle}>
                  {currencyFormatter(item.ratePerUnit || 0, 'NGN')} / {item.currency}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Trade details</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Card value</Text>
          <TextInput
            style={styles.input}
            value={cardValue}
            onChangeText={(value) => setCardValue(value.replace(/[^0-9.]/g, '').slice(0, 10))}
            keyboardType="decimal-pad"
            placeholder={selectedCard ? `Enter amount in ${selectedCard.currency}` : 'Select a card first'}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Card type</Text>
          <View style={styles.optionRow}>
            {['physical', 'e_code'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, cardType === option && styles.optionButtonActive]}
                onPress={() => setCardType(option)}
              >
                <Text style={[styles.optionText, cardType === option && styles.optionTextActive]}>
                  {option === 'physical' ? 'Physical' : 'E-code'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Submission method</Text>
          <View style={styles.optionRow}>
            {[
              { key: 'images', label: 'Upload images' },
              { key: 'code', label: 'Enter code' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.optionButton, submissionMethod === option.key && styles.optionButtonActive]}
                onPress={() => setSubmissionMethod(option.key)}
              >
                <Text style={[styles.optionText, submissionMethod === option.key && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {submissionMethod === 'images' ? (
            <View>
              <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('front')}>
                {frontImageUrl ? (
                  <Image source={{ uri: frontImageUrl }} style={styles.previewImage} />
                ) : (
                  <View style={styles.uploadEmpty}>
                    <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                    <Text style={styles.uploadTitle}>Upload front image</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('back')}>
                {backImageUrl ? (
                  <Image source={{ uri: backImageUrl }} style={styles.previewImage} />
                ) : (
                  <View style={styles.uploadEmpty}>
                    <Ionicons name="images-outline" size={24} color={colors.primary} />
                    <Text style={styles.uploadTitle}>Upload back image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={cardCode}
                onChangeText={setCardCode}
                placeholder="Enter gift card code"
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <TextInput
                style={styles.input}
                value={tradeCodePin}
                onChangeText={setTradeCodePin}
                placeholder="Enter card PIN if available"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}

          <Text style={styles.label}>Note for reviewer</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Add any helpful context for review"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <View style={styles.estimateCard}>
            <Text style={styles.estimateLabel}>Estimated payout</Text>
            <Text style={styles.estimateValue}>
              {estimatedPayout > 0 ? currencyFormatter(estimatedPayout, 'NGN') : 'N0'}
            </Text>
            <Text style={styles.estimateNote}>Final payout depends on admin verification.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!selectedCard || !cardValue || loading) && styles.submitButtonDisabled]}
          onPress={openPinModal}
          disabled={!selectedCard || !cardValue || loading}
        >
          <Text style={styles.submitButtonText}>Submit for review</Text>
        </TouchableOpacity>

        <View style={styles.historySection}>
          <Text style={styles.sectionLabel}>Recent trades</Text>
          {trades.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No gift card trades yet.</Text>
            </View>
          ) : (
            trades.map((trade) => {
              const statusMeta = STATUS_COPY[trade.status] || STATUS_COPY.pending_review;
              return (
                <View key={trade._id} style={styles.tradeCard}>
                  <View style={styles.tradeHeader}>
                    <View>
                      <Text style={styles.tradeTitle}>
                        {trade.brand} {trade.country} {trade.cardValue}
                        {trade.currency}
                      </Text>
                      <Text style={styles.tradeReference}>{trade.reference}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusMeta.color}20` }]}>
                      <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    </View>
                  </View>
                  <View style={styles.tradeRow}>
                    <Text style={styles.tradeLabel}>Estimated payout</Text>
                    <Text style={styles.tradeValue}>
                      {currencyFormatter(trade.estimatedPayout || trade.finalPayout || 0, 'NGN')}
                    </Text>
                  </View>
                  {trade.reviewNote ? (
                    <Text style={styles.tradeNote}>Admin note: {trade.reviewNote}</Text>
                  ) : null}
                  {trade.rejectionReason ? (
                    <Text style={styles.tradeReject}>Reason: {trade.rejectionReason}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <BillPinModal
        visible={showPinModal}
        pin={pin}
        setPin={setPin}
        loading={loading}
        onConfirm={submitTrade}
        onClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
        title="Confirm gift card trade"
        subtitle="Enter your transaction PIN to submit this card for review"
      />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    placeholder: { width: 40 },
    scrollView: { flex: 1, paddingHorizontal: 16 },
    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    balanceLabel: { color: colors.textMuted, fontSize: 13 },
    balanceValue: { color: colors.success, fontSize: 24, fontWeight: '700', marginTop: 6 },
    infoCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    infoCopy: { flex: 1 },
    infoTitle: { color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: 4 },
    infoText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
    sectionLabel: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 12 },
    cardGrid: { gap: 10 },
    rateCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border
    },
    rateCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    rateTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
    rateTitleActive: { color: colors.primary },
    rateSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    label: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8 },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14
    },
    multilineInput: {
      minHeight: 92,
      textAlignVertical: 'top'
    },
    optionRow: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap'
    },
    optionButton: {
      flex: 1,
      minWidth: 120,
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      alignItems: 'center'
    },
    optionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    optionText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    optionTextActive: { color: colors.primary },
    uploadCard: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 10
    },
    uploadEmpty: {
      minHeight: 120,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8
    },
    uploadTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    previewImage: { width: '100%', height: 160, resizeMode: 'cover' },
    estimateCard: {
      marginTop: 16,
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      padding: 14
    },
    estimateLabel: { color: colors.textMuted, fontSize: 13 },
    estimateValue: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 6 },
    estimateNote: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      alignItems: 'center',
      paddingVertical: 16,
      marginTop: 18,
      marginBottom: 10
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: colors.black, fontSize: 16, fontWeight: '700' },
    historySection: { paddingBottom: 28 },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    emptyText: { color: colors.textMuted, fontSize: 13 },
    tradeCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12
    },
    tradeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12
    },
    tradeTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    tradeReference: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6
    },
    statusText: { fontSize: 12, fontWeight: '700' },
    tradeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 14
    },
    tradeLabel: { color: colors.textMuted, fontSize: 13 },
    tradeValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
    tradeNote: { color: colors.primary, fontSize: 13, marginTop: 12 },
    tradeReject: { color: colors.error || '#ef4444', fontSize: 13, marginTop: 8 }
  });
