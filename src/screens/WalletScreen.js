import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import QRCode from '../components/QRCodeWrapper';
import { walletAPI, priceAPI } from '../api/client';

const formatCrypto = (value, decimals = 4) => parseFloat(value).toFixed(decimals);
const formatCurrency = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);

export default function WalletScreen({ navigation }) {
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [activeTab, setActiveTab] = useState('assets');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, pricesRes] = await Promise.all([
        walletAPI.getWallet(),
        priceAPI.getPrices(),
      ]);
      setWallet(walletRes.data);
      setPrices(pricesRes.data);
    } catch (error) {
      console.log('Load wallet error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateTotalValue = () => {
    if (!wallet?.balances || !prices) return 0;
    return (
      (wallet.balances.SOL || 0) * (prices.SOL?.ngn || 0) +
      (wallet.balances.USDT || 0) * (prices.USDT?.ngn || 0) +
      (wallet.balances.FLAME || 0) * (prices.FLAME?.ngn || 0)
    );
  };

  const assets = [
    { symbol: 'SOL', name: 'Solana', color: '#9945FF' },
    { symbol: 'USDT', name: 'Tether USD', color: '#26A17B' },
    { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
    { symbol: 'FLAME', name: 'Flame Token', color: '#FF6B00' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['assets', 'receive', 'keys'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB800" />
        }
      >
        {activeTab === 'assets' && (
          <View style={styles.content}>
            {/* Total Value */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Crypto Value</Text>
              <Text style={styles.totalValue}>{formatCurrency(calculateTotalValue())}</Text>
            </View>

            {/* Assets List */}
            <View style={styles.assetsList}>
              {assets.map((asset) => {
                const balance = wallet?.balances?.[asset.symbol] || 0;
                const value = balance * (prices[asset.symbol]?.ngn || 0);
                const change = prices[asset.symbol]?.change24h || 0;
                return (
                  <View key={asset.symbol} style={styles.assetCard}>
                    <View style={[styles.assetIcon, { backgroundColor: asset.color }]}>
                      <Text style={styles.assetIconText}>{asset.symbol[0]}</Text>
                    </View>
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetBalance}>
                        {formatCrypto(balance)} {asset.symbol}
                      </Text>
                    </View>
                    <View style={styles.assetValue}>
                      <Text style={styles.assetValueText}>{formatCurrency(value)}</Text>
                      <Text style={[styles.assetChange, change >= 0 ? styles.positive : styles.negative]}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Deposit Button */}
            <TouchableOpacity
              style={styles.depositButton}
              onPress={() => navigation.navigate('Deposit')}
            >
              <Icon name="plus" size={20} color="#0a0a0a" />
              <Text style={styles.depositButtonText}>Deposit Crypto</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'receive' && (
          <View style={styles.content}>
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={wallet?.walletAddress || 'FlameX'}
                  size={200}
                  backgroundColor="#fff"
                  color="#0a0a0a"
                />
              </View>
              <Text style={styles.qrLabel}>Your Solana Address</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.address} numberOfLines={1}>
                  {wallet?.walletAddress}
                </Text>
              </View>
              <Text style={styles.qrHint}>Only send SOL and SPL tokens to this address</Text>
            </View>
          </View>
        )}

        {activeTab === 'keys' && (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.keysButton}
              onPress={() => navigation.navigate('Keys')}
            >
              <Icon name="key" size={24} color="#FFB800" />
              <View style={styles.keysButtonText}>
                <Text style={styles.keysButtonTitle}>View Private Keys</Text>
                <Text style={styles.keysButtonSubtitle}>Seed phrase & private key</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>

            <View style={styles.walletInfo}>
              <Text style={styles.sectionTitle}>Wallet Info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>Non-Custodial</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Network</Text>
                <Text style={styles.infoValue}>Solana (SPL)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {wallet?.walletAddress?.slice(0, 8)}...{wallet?.walletAddress?.slice(-8)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFB800',
  },
  tabText: {
    color: '#999',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0a0a0a',
  },
  content: {
    padding: 20,
  },
  totalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  assetsList: {
    gap: 12,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  assetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  assetName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  assetBalance: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  assetValue: {
    alignItems: 'flex-end',
  },
  assetValueText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  assetChange: {
    fontSize: 12,
    marginTop: 2,
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#f44336',
  },
  depositButton: {
    flexDirection: 'row',
    backgroundColor: '#FFB800',
    borderRadius: 16,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
  },
  qrLabel: {
    fontSize: 16,
    color: '#999',
    marginTop: 24,
    marginBottom: 12,
  },
  addressContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  address: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  qrHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
  },
  keysButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  keysButtonText: {
    flex: 1,
    marginLeft: 16,
  },
  keysButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  keysButtonSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  walletInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

