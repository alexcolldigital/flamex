import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { normalizeTransaction } from '../../lib/finance';
import { useAppTheme } from '../../theme/ThemeProvider';
import { transactionAPI } from '../../api/client';

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', icon: 'time-outline', label: 'Pending' },
  completed: { color: '#22c55e', icon: 'checkmark-circle-outline', label: 'Completed' },
  failed: { color: '#ef4444', icon: 'close-circle-outline', label: 'Failed' },
  cancelled: { color: '#666', icon: 'ban-outline', label: 'Cancelled' }
};

const TYPE_CONFIG = {
  send: { icon: 'arrow-up-outline', color: '#ef4444', label: 'Sent' },
  receive: { icon: 'arrow-down-outline', color: '#22c55e', label: 'Received' },
  swap: { icon: 'swap-horizontal-outline', color: '#f59e0b', label: 'Swap' },
  stake: { icon: 'lock-closed-outline', color: '#8b5cf6', label: 'Staked' },
  unstake: { icon: 'lock-open-outline', color: '#3b82f6', label: 'Unstaked' },
  deposit: { icon: 'add-circle-outline', color: '#22c55e', label: 'Deposit' },
  withdrawal: { icon: 'remove-circle-outline', color: '#ef4444', label: 'Withdrawal' },
  bill: { icon: 'receipt-outline', color: '#ec4899', label: 'Bill Payment' },
  virtual_card: { icon: 'credit-card-outline', color: '#2563eb', label: 'Virtual Card' }
};

const BILL_FIELD_MAP = [
  ['provider', 'Provider'],
  ['phoneNumber', 'Phone number'],
  ['meterNumber', 'Meter number'],
  ['smartCardNumber', 'Smart card number'],
  ['accountId', 'Account ID'],
  ['category', 'Category']
];

export default function TransactionDetailsScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const styles = useMemo(() => createStyles(colors, width, isTablet), [colors, width, isTablet]);
  const transaction = normalizeTransaction(route.params?.transaction || {});
  const [emailSending, setEmailSending] = useState(false);

  if (!transaction._id) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Transaction not found</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
  const typeConfig = TYPE_CONFIG[transaction.type] || TYPE_CONFIG.send;
  const isCredit = ['receive', 'deposit'].includes(transaction.type);
  const receiptTitle =
    transaction.type === 'bill'
      ? 'Bill Payment Receipt'
      : isCredit
      ? 'Credit Receipt'
      : 'Debit Receipt';
  const metadata = transaction.metadata || {};

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const receiptRows = [
    ['Receipt No.', transaction.reference || transaction._id, true],
    ['Transaction ID', transaction._id, true],
    ['Date & Time', formatDate(transaction.createdAt), false],
    ['Status', statusConfig.label, false],
    ['Transaction Type', typeConfig.label, false],
    ['Amount', `${isCredit ? '+' : '-'}${transaction.amount} ${transaction.symbol}`, false],
    transaction.fee !== undefined
      ? ['Fee', `${transaction.fee} ${transaction.feeCurrency || transaction.symbol}`, false]
      : null,
    transaction.toUsername ? ['To', `@${transaction.toUsername}`, false] : null,
    transaction.fromUsername ? ['From', `@${transaction.fromUsername}`, false] : null,
    transaction.chain ? ['Network', transaction.chain, false] : null,
    transaction.txHash ? ['Transaction Hash', truncateAddress(transaction.txHash), true, transaction.txHash] : null,
    transaction.description ? ['Description', transaction.description, false] : null,
    ...BILL_FIELD_MAP
      .map(([key, label]) => (metadata[key] ? [label, String(metadata[key]), false] : null))
      .filter(Boolean)
  ].filter(Boolean);

  const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(String(text || ''));
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const receiptMessage = () =>
    [
      `FlameX ${receiptTitle}`,
      `Status: ${statusConfig.label}`,
      `Type: ${typeConfig.label}`,
      `Amount: ${isCredit ? '+' : '-'}${transaction.amount} ${transaction.symbol}`,
      `Reference: ${transaction.reference || transaction._id}`,
      `Date: ${formatDate(transaction.createdAt)}`,
      transaction.description ? `Description: ${transaction.description}` : null,
      metadata.provider ? `Provider: ${metadata.provider}` : null,
      metadata.phoneNumber ? `Phone: ${metadata.phoneNumber}` : null,
      metadata.meterNumber ? `Meter: ${metadata.meterNumber}` : null,
      metadata.smartCardNumber ? `Smart Card: ${metadata.smartCardNumber}` : null
    ]
      .filter(Boolean)
      .join('\n');

  const handleShare = async () => {
    try {
      await Share.share({
        message: receiptMessage()
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyReceipt = async () => {
    await copyToClipboard(receiptMessage(), 'Receipt');
  };

  const handleEmailReceipt = async () => {
    if (emailSending) return;
    setEmailSending(true);
    try {
      await transactionAPI.getReceipt(transaction._id, true);
      Alert.alert('Receipt sent', 'A receipt has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Could not send receipt email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const DetailRow = ({ label, value, copyable = false, fullValue = '' }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={styles.detailValue} numberOfLines={1}>
          {value}
        </Text>
        {copyable ? (
          <TouchableOpacity onPress={() => copyToClipboard(fullValue || value, label)} style={styles.copyButton}>
            <Ionicons name="copy-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{receiptTitle}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand badge */}
        <View style={styles.brandCard}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>FlameX</Text>
          </View>
          <Text style={styles.brandSub}>Transaction Receipt</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusConfig.color}20` }]}>
            <Ionicons name={statusConfig.icon} size={40} color={statusConfig.color} />
          </View>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          <Text style={styles.typeText}>{receiptTitle}</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={[styles.amountValue, { color: isCredit ? colors.success : colors.danger }]}>
            {isCredit ? '+' : '-'}
            {transaction.amount} {transaction.symbol}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusConfig.color}20`, borderColor: statusConfig.color }]}>
            <Text style={[styles.statusPillText, { color: statusConfig.color }]}>{statusConfig.label.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.receiptActionRow}>
          <TouchableOpacity style={styles.receiptAction} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            <Text style={styles.receiptActionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.receiptAction} onPress={handleCopyReceipt}>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={styles.receiptActionText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.receiptAction} onPress={handleEmailReceipt} disabled={emailSending}>
            <Ionicons name="mail-outline" size={18} color={emailSending ? colors.textMuted : colors.primary} />
            <Text style={[styles.receiptActionText, emailSending && { color: colors.textMuted }]}>
              {emailSending ? 'Sending…' : 'Email'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Receipt Details</Text>
          {receiptRows.map(([label, value, copyable = false, fullValue = '']) => (
            <DetailRow
              key={label}
              label={label}
              value={value}
              copyable={copyable}
              fullValue={fullValue || value}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, width, isTablet) => {
  const hp = width >= 768 ? 24 : 16;   // horizontal padding
  const cardRadius = isTablet ? 20 : 16;
  const amountFontSize = width < 360 ? 26 : isTablet ? 40 : 32;
  const detailValueMaxWidth = width * 0.45;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: hp,
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
      fontSize: isTablet ? 20 : 17,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8
    },
    shareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center'
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: hp,
      paddingTop: 12
    },
    // centre content on wide screens
    scrollContent: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: isTablet ? 600 : undefined,
      paddingBottom: 32
    },
    brandCard: {
      alignItems: 'center',
      paddingVertical: isTablet ? 24 : 16,
      marginBottom: 4
    },
    brandBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 8,
      marginBottom: 8
    },
    brandText: {
      color: colors.black,
      fontSize: isTablet ? 22 : 20,
      fontWeight: '900',
      letterSpacing: 1
    },
    brandSub: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1
    },
    statusCard: {
      backgroundColor: colors.surface,
      borderRadius: cardRadius,
      padding: isTablet ? 28 : 20,
      alignItems: 'center',
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border
    },
    statusIcon: {
      width: isTablet ? 80 : 64,
      height: isTablet ? 80 : 64,
      borderRadius: isTablet ? 40 : 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10
    },
    statusText: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '700'
    },
    typeText: {
      fontSize: isTablet ? 15 : 13,
      color: colors.textMuted,
      marginTop: 4
    },
    amountCard: {
      backgroundColor: colors.surface,
      borderRadius: cardRadius,
      padding: isTablet ? 24 : 18,
      alignItems: 'center',
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border
    },
    amountLabel: {
      fontSize: 11,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1
    },
    amountValue: {
      fontSize: amountFontSize,
      fontWeight: '900',
      marginTop: 6,
      marginBottom: 12,
      letterSpacing: -0.5,
      textAlign: 'center'
    },
    statusPill: {
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1
    },
    receiptActionRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10
    },
    receiptAction: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      borderRadius: cardRadius - 4,
      paddingVertical: isTablet ? 15 : 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    receiptActionText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: width < 360 ? 11 : 13
    },
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: cardRadius,
      padding: isTablet ? 20 : 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    detailsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: isTablet ? 14 : 11,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    detailLabel: {
      fontSize: isTablet ? 14 : 13,
      color: colors.textMuted,
      flex: 1,
      marginRight: 8
    },
    detailValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1
    },
    detailValue: {
      fontSize: isTablet ? 14 : 13,
      color: colors.text,
      fontWeight: '600',
      maxWidth: detailValueMaxWidth,
      flexShrink: 1
    },
    copyButton: {
      padding: 4
    },
    errorText: {
      color: colors.danger,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 40
    }
  });
};
