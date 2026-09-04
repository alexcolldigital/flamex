import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CHAIN_COLORS = {
  solana: '#9945FF',
  ethereum: '#627EEA',
  bsc: '#F3BA2F',
  polygon: '#8247E5',
  base: '#0052FF',
  arbitrum: '#28A0F0',
};

export default function TokenCard({ symbol, name, balance, price, change24h, chain, onPress, selected = false }) {
  const totalValue = balance * price;
  const isPositive = change24h >= 0;
  const chainColor = CHAIN_COLORS[chain] || '#94A3B8';

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: `${chainColor}18` }]}>
          <Text style={[styles.iconText, { color: chainColor }]}>{symbol.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.chainBadge}>
            <View style={[styles.chainDot, { backgroundColor: chainColor }]} />
            <Text style={styles.chainName}>{chain.charAt(0).toUpperCase() + chain.slice(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.balance}>{balance.toFixed(4)}</Text>
        <Text style={styles.value}>${totalValue.toFixed(2)}</Text>
        {change24h !== undefined && (
          <View style={styles.changeRow}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={isPositive ? '#22C55E' : '#EF4444'}
            />
            <Text style={[styles.change, { color: isPositive ? '#22C55E' : '#EF4444' }]}>
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111722',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  selected: { borderColor: '#22C55E' },
  left: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 18, fontWeight: 'bold' },
  symbol: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  name: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  chainBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  chainDot: { width: 6, height: 6, borderRadius: 3 },
  chainName: { fontSize: 10, color: '#475569', textTransform: 'capitalize' },
  right: { alignItems: 'flex-end' },
  balance: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  value: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  change: { fontSize: 12, fontWeight: '500' },
});
