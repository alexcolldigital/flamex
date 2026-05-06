import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TRANSACTION_TYPES = {
  send: { icon: 'arrow-up-outline', color: '#ef4444', label: 'Sent' },
  receive: { icon: 'arrow-down-outline', color: '#22c55e', label: 'Received' },
  swap: { icon: 'swap-horizontal-outline', color: '#f59e0b', label: 'Swapped' },
  stake: { icon: 'lock-closed-outline', color: '#8b5cf6', label: 'Staked' },
  unstake: { icon: 'lock-open-outline', color: '#3b82f6', label: 'Unstaked' },
  deposit: { icon: 'add-circle-outline', color: '#22c55e', label: 'Deposit' },
  withdraw: { icon: 'remove-circle-outline', color: '#ef4444', label: 'Withdrawal' },
  referral: { icon: 'people-outline', color: '#f59e0b', label: 'Referral' },
  bill: { icon: 'receipt-outline', color: '#ec4899', label: 'Bill Payment' },
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  completed: '#22c55e',
  failed: '#ef4444',
  cancelled: '#666',
};

export default function TransactionCard({
  type,
  amount,
  symbol,
  status,
  timestamp,
  from,
  to,
  fee,
  onPress,
}) {
  const typeInfo = TRANSACTION_TYPES[type] || TRANSACTION_TYPES.send;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconContainer, { backgroundColor: `${typeInfo.color}20` }]}>
        <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.type}>{typeInfo.label}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.status, { color: statusColor }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
        {from && (
          <Text style={styles.address} numberOfLines={1}>
            From: {from}
          </Text>
        )}
        {to && (
          <Text style={styles.address} numberOfLines={1}>
            To: {to}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: type === 'receive' || type === 'deposit' || type === 'referral' ? '#22c55e' : '#fff' },
          ]}
        >
          {type === 'receive' || type === 'deposit' || type === 'referral' ? '+' : '-'}
          {amount} {symbol}
        </Text>
        <Text style={styles.date}>{formatDate(timestamp)}</Text>
        {fee && <Text style={styles.fee}>Fee: {fee}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    marginLeft: 12,
  },
  type: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  address: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    maxWidth: 150,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  fee: {
    fontSize: 11,
    color: '#444',
    marginTop: 2,
  },
});
