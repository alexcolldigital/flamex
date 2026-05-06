import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { walletAPI, priceAPI, stakingAPI } from '../api/client';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatCrypto = (value, decimals = 4) => {
  return parseFloat(value).toFixed(decimals);
};

export default function HomeScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [stakingStats, setStakingStats] = useState({ SOL: { staked: 0, rewards: 0 }, FLAME: { staked: 0, rewards: 0 } });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, pricesRes, stakingRes] = await Promise.all([
        walletAPI.getWallet(),
        priceAPI.getPrices(),
        stakingAPI.getStats(),
      ]);
      setWallet(walletRes.data);
      setPrices(pricesRes.data);
      setStakingStats(stakingRes.data);
    } catch (error) {
      console.log('Load data error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshUser()]);
    setRefreshing(false);
  };

  const calculateTotalValue = () => {
    if (!wallet || !prices) return 0;
    const ngn = wallet.balances?.NGN || 0;
    const sol = (wallet.balances?.SOL || 0) * (prices.SOL?.ngn || 0);
    const usdt = (wallet.balances?.USDT || 0) * (prices.USDT?.ngn || 0);
    const flame = (wallet.balances?.FLAME || 0) * (prices.FLAME?.ngn || 0);
    return ngn + sol + usdt + flame;
  };

  const quickActions = [
    { icon: 'arrow-down', label: 'Deposit', screen: 'Deposit', color: '#4CAF50' },
    { icon: 'arrow-up', label: 'Send', screen: 'Withdraw', color: '#FFB800' },
    { icon: 'swap-horizontal', label: 'Swap', screen: 'Swap', color: '#2196F3' },
    { icon: 'lock', label: 'Stake', screen: 'Stake', color: '#FF9800' },
  ];

  const services = [
    { icon: 'flash', label: 'Electricity', screen: 'Bills', color: '#FFEB3B' },
    { icon: 'cellphone', label: 'Airtime', screen: 'Bills', color: '#2196F3' },
    { icon: 'television', label: 'Cable TV', screen: 'Bills', color: '#9C27B0' },
    { icon: 'gift', label: 'Gift Cards', screen: 'GiftCards', color: '#E91E63' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB800" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.firstName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(calculateTotalValue())}</Text>
          <View style={styles.balanceStats}>
            <View>
              <Text style={styles.statLabel}>NGN</Text>
              <Text style={styles.statValue}>{formatCurrency(wallet?.balances?.NGN || 0)}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Crypto</Text>
              <Text style={styles.statValue}>
                {formatCurrency(calculateTotalValue() - (wallet?.balances?.NGN || 0))}
              </Text>
            </View>
          </View>
        </View>

        {/* Staking Stats */}
        {(stakingStats.SOL.staked > 0 || stakingStats.FLAME.staked > 0) && (
          <View style={styles.stakingCard}>
            <Text style={styles.sectionTitle}>Staking</Text>
            <View style={styles.stakingRow}>
              {stakingStats.SOL.staked > 0 && (
                <View style={styles.stakingItem}>
                  <Icon name="ethereum" size={20} color="#9945FF" />
                  <Text style={styles.stakingValue}>{formatCrypto(stakingStats.SOL.staked)} SOL</Text>
                  <Text style={styles.stakingReward}>+{formatCrypto(stakingStats.SOL.rewards)}</Text>
                </View>
              )}
              {stakingStats.FLAME.staked > 0 && (
                <View style={styles.stakingItem}>
                  <Icon name="fire" size={20} color="#FF6B00" />
                  <Text style={styles.stakingValue}>{formatCrypto(stakingStats.FLAME.staked)} FLAME</Text>
                  <Text style={styles.stakingReward}>+{formatCrypto(stakingStats.FLAME.rewards)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Icon name={action.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={styles.serviceButton}
                onPress={() => navigation.navigate(service.screen)}
              >
                <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
                  <Icon name={service.icon} size={20} color="#0a0a0a" />
                </View>
                <Text style={styles.serviceLabel}>{service.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Assets */}
        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Your Assets</Text>
          {[
            { symbol: 'NGN', name: 'Nigerian Naira', balance: wallet?.balances?.NGN || 0, color: '#4CAF50' },
            { symbol: 'SOL', name: 'Solana', balance: wallet?.balances?.SOL || 0, color: '#9945FF' },
            { symbol: 'USDT', name: 'Tether USD', balance: wallet?.balances?.USDT || 0, color: '#26A17B' },
            { symbol: 'FLAME', name: 'Flame Token', balance: wallet?.balances?.FLAME || 0, color: '#FF6B00' },
          ].map((asset) => (
            <TouchableOpacity
              key={asset.symbol}
              style={styles.assetItem}
              onPress={() => navigation.navigate('Wallet')}
            >
              <View style={[styles.assetIcon, { backgroundColor: asset.color }]}>
                <Text style={styles.assetSymbol}>{asset.symbol[0]}</Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetBalance}>
                  {asset.symbol === 'NGN'
                    ? formatCurrency(asset.balance)
                    : `${formatCrypto(asset.balance)} ${asset.symbol}`}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  greeting: {
    fontSize: 12,
    color: '#999',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  stakingCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  stakingRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  stakingItem: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  stakingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  stakingReward: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#fff',
  },
  servicesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceButton: {
    width: '23%',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
  },
  assetsSection: {
    padding: 20,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  assetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  assetName: {
    fontSize: 14,
    color: '#fff',
  },
  assetBalance: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

