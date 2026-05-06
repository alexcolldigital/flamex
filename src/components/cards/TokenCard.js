import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TokenCard({
  symbol,
  name,
  balance,
  price,
  change24h,
  chain,
  onPress,
  selected = false,
}) {
  const totalValue = balance * price;
  const isPositive = change24h >= 0;

  const getChainColor = () => {
    const colors = {
      solana: '#9945ff',
      ethereum: '#627eea',
      bsc: '#f3ba2f',
      polygon: '#8247e5',
      base: '#0052ff',
      arbitrum: '#28a0f0',
    };
    return colors[chain] || '#888';
  };

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: `${getChainColor()}20` }]}>
          <Text style={[styles.iconText, { color: getChainColor() }]}>
            {symbol.charAt(0)}
          </Text>
        </View>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.chainBadge}>
            <View style={[styles.chainDot, { backgroundColor: getChainColor() }]} />
            <Text style={styles.chainName}>{chain.charAt(0).toUpperCase() + chain.slice(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.balance}>{balance.toFixed(4)}</Text>
        <Text style={styles.value}>${totalValue.toFixed(2)}</Text>
        {change24h !== undefined && (
          <View style={styles.changeContainer}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={isPositive ? '#22c55e' : '#ef4444'}
            />
            <Text style={[styles.change, { color: isPositive ? '#22c55e' : '#ef4444' }]}>
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
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#f59e0b',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  name: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  chainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chainName: {
    fontSize: 10,
    color: '#666',
    textTransform: 'capitalize',
  },
  right: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  value: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: '500',
  },
});
