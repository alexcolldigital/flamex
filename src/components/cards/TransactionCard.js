import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TYPES = {
  send:     { icon: 'arrow-up-outline',      color: '#EF4444', label: 'Sent' },
  receive:  { icon: 'arrow-down-outline',    color: '#22C55E', label: 'Received' },
  swap:     { icon: 'swap-horizontal-outline', color: '#F59E0B', label: 'Swapped' },
  stake:    { icon: 'lock-closed-outline',   color: '#8B5CF6', label: 'Staked' },
  unstake:  { icon: 'lock-open-outline',     color: '#3B82F6', label: 'Unstaked' },
  deposit:  { icon: 'add-circle-outline',    color: '#22C55E', label: 'Deposit' },
  withdraw: { icon: 'remove-circle-outline', color: '#EF4444', label: 'Withdrawal' },
  referral: { icon: 'people-outline',        color: '#22C55E', label: 'Referral' },
  bill:     { icon: 'receipt-outline',       color: '#F59E0B', label: 'Bill Payment' },
};

const STATUS_COLORS = {
  pending:   '#F59E0B',
  completed: '#22C55E',
  failed:    '#EF4444',
  cancelled: '#475569',
};

const CREDIT_TYPES = new Set(['receive', 'deposit', 'referral']);

export default function TransactionCard({ type, amount, symbol, status, timestamp, from, to, fee, onPress }) {
  const info = TYPES[type] || TYPES.send;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const isCredit = CREDIT_TYPES.has(type);

  const formatDate = (date) => {
    const d = new Date(date);
    const diff = Date.now() - d;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconWrap, { backgroundColor: `${info.color}18` }]}>
        <Ionicons name={info.icon} size={20} color={info.color} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.type}>{info.label}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.status, { color: statusColor }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
        {from && <Text style={styles.address} numberOfLines={1}>From: {from}</Text>}
        {to   && <Text style={styles.address} numberOfLines={1}>To: {to}</Text>}
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: isCredit ? '#22C55E' : '#FFFFFF' }]}>
          {isCredit ? '+' : '-'}{amount} {symbol}
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
    backgroundColor: '#111722',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middle: { flex: 1, marginLeft: 12 },
  type: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  status: { fontSize: 12, fontWeight: '500' },
  address: { fontSize: 11, color: '#475569', marginTop: 2, maxWidth: 150 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '600' },
  date: { fontSize: 12, color: '#475569', marginTop: 4 },
  fee: { fontSize: 11, color: '#334155', marginTop: 2 },
});
