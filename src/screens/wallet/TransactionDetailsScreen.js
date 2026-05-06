import * as Clipboard from 'expo-clipboard';
import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { normalizeTransaction } from '../../lib/finance';
import { useAppTheme } from '../../theme/ThemeProvider';

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
  const styles = useMemo(() => createStyles(colors), [colors]);
  const transaction = normalizeTransaction(route.params?.transaction || {});

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusConfig.color}20` }]}>
            <Ionicons name={statusConfig.icon} size={40} color={statusConfig.color} />
          </View>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          <Text style={styles.typeText}>{receiptTitle}</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            {isCredit ? '+' : '-'}
            {transaction.amount} {transaction.symbol}
          </Text>
        </View>

        <View style={styles.receiptActionRow}>
          <TouchableOpacity style={styles.receiptAction} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            <Text style={styles.receiptActionText}>Share receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.receiptAction} onPress={handleCopyReceipt}>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={styles.receiptActionText}>Copy receipt</Text>
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
      padding: 16
    },
    statusCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    statusIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12
    },
    statusText: {
      fontSize: 20,
      fontWeight: '700'
    },
    typeText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4
    },
    amountCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    amountLabel: {
      fontSize: 13,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1
    },
    amountValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8
    },
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    detailsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16
    },
    receiptActionRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16
    },
    receiptAction: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border
    },
    receiptActionText: {
      color: colors.primary,
      fontWeight: '700'
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textMuted
    },
    detailValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      maxWidth: 180
    },
    copyButton: {
      padding: 4
    },
    noteRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    noteText: {
      fontSize: 14,
      color: colors.text,
      marginTop: 8
    },
    errorText: {
      color: colors.danger,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 40
    }
  });
