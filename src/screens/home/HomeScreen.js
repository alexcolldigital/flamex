import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { priceAPI, stakingAPI, walletAPI } from '../../api/client';
import {
  buildPriceRows,
  currencyFormatter,
  tokenFormatter
} from '../../lib/finance';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function HomeScreen({ navigation }) {
  const { user, logout, fetchUserProfile } = useAuthStore();
  const { unreadCount, initializeNotifications } = useNotificationStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [ngnRate, setNgnRate] = useState(null);
  const [stakingStats, setStakingStats] = useState({
    SOL: { staked: 0, rewards: 0 },
    FLAME: { staked: 0, rewards: 0 }
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [walletRes, pricesRes, stakingRes, ngnRateRes] = await Promise.all([
        walletAPI.getWallet(),
        priceAPI.getPrices(),
        stakingAPI.getStats(),
        priceAPI.getNgnRate()
      ]);

      setWallet(walletRes.data);
      setPrices(pricesRes.data);
      setStakingStats(stakingRes.data);
      setNgnRate(ngnRateRes.data);
    } catch (error) {
      console.log('Load dashboard error:', error);
    }
  };

  useEffect(() => {
    loadData();
    initializeNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), fetchUserProfile()]);
    setRefreshing(false);
  };

  const totalValue = () => {
    if (!wallet?.balances) return 0;

    return (
      Number(wallet.balances.NGN || 0) +
      Number(wallet.balances.USD || 0) * Number(prices.USDT?.ngn || 1500) +
      Number(wallet.balances.SOL || 0) * Number(prices.SOL?.ngn || 0) +
      Number(wallet.balances.USDT || 0) * Number(prices.USDT?.ngn || 0) +
      Number(wallet.balances.USDC || 0) * Number(prices.USDC?.ngn || 0) +
      Number(wallet.balances.FLAME || 0) * Number(prices.FLAME?.ngn || 0) +
      Number(wallet.balances.ETH || 0) * Number(prices.ETH?.ngn || 0) +
      Number(wallet.balances.BNB || 0) * Number(prices.BNB?.ngn || 0)
    );
  };

  const quickActions = [
    { icon: 'bank-transfer-in', label: 'Deposit', screen: 'Deposit', color: colors.success },
    { icon: 'bank-transfer-out', label: 'Withdraw', screen: 'Withdraw', color: colors.danger },
    { icon: 'send-outline', label: 'Send', screen: 'Transfer', color: colors.primary },
    { icon: 'swap-horizontal', label: 'Swap', screen: 'Swap', color: colors.accent },
    { icon: 'receipt-text-outline', label: 'Bills', screen: 'Bills', color: colors.primary },
    { icon: 'handshake-outline', label: 'P2P', screen: 'P2P', color: colors.success }
  ];

  const assets = [
    { symbol: 'NGN', name: 'Nigerian Naira', value: wallet?.balances?.NGN || 0, color: colors.success },
    { symbol: 'USD', name: 'US Dollar Balance', value: wallet?.balances?.USD || 0, color: colors.accent },
    { symbol: 'SOL', name: 'Solana', value: wallet?.balances?.SOL || 0, color: '#9945FF' },
    { symbol: 'USDT', name: 'Tether USD', value: wallet?.balances?.USDT || 0, color: '#26A17B' }
  ];

  const priceRows = buildPriceRows(prices).slice(0, 4);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user?.firstName || 'FlameX user'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={logout}>
              <Icon name="logout" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Portfolio Value</Text>
          <Text style={styles.balanceValue}>{currencyFormatter(totalValue())}</Text>
          <View style={styles.balanceStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>NGN</Text>
              <Text style={styles.statValue}>{currencyFormatter(wallet?.balances?.NGN || 0)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>USD</Text>
              <Text style={styles.statValue}>{currencyFormatter(wallet?.balances?.USD || 0, 'USD')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>KYC</Text>
              <Text style={styles.statValue}>{user?.kycVerified ? 'Verified' : 'Pending'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionButton}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}22` }]}>
                <Icon name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Price Pulse</Text>
            <Text style={styles.rateText}>
              1 USDT = {currencyFormatter(ngnRate?.rate || prices.USDT?.ngn || 0)}
            </Text>
          </View>
          {priceRows.map((asset) => (
            <View key={asset.symbol} style={styles.priceRow}>
              <View style={[styles.assetIcon, { backgroundColor: asset.color }]}>
                <Text style={styles.assetIconText}>{asset.symbol[0]}</Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetValueText}>
                  {currencyFormatter(asset.ngn)} • ${asset.usd.toFixed(2)}
                </Text>
              </View>
              <Text
                style={[
                  styles.priceDelta,
                  { color: asset.change24h >= 0 ? colors.success : colors.danger }
                ]}
              >
                {asset.change24h >= 0 ? '+' : ''}
                {asset.change24h.toFixed(2)}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <View style={styles.accountRow}>
            <View>
              <Text style={styles.accountLabel}>NGN Account</Text>
              <Text style={styles.accountValue}>
                {wallet?.fiatAccounts?.NGN?.bankName} • {wallet?.fiatAccounts?.NGN?.accountNumber}
              </Text>
            </View>
            <Text style={styles.accountBadge}>Live</Text>
          </View>
          <View style={styles.accountRow}>
            <View>
              <Text style={styles.accountLabel}>USD Balance ID</Text>
              <Text style={styles.accountValue}>{wallet?.fiatAccounts?.USD?.accountId || 'Pending'}</Text>
            </View>
            <Text style={styles.accountBadge}>Ready</Text>
          </View>
          <TouchableOpacity style={styles.inlineLink} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.inlineLinkText}>Open wallet controls</Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {(stakingStats.SOL?.staked > 0 || stakingStats.FLAME?.staked > 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Staking</Text>
            <Text style={styles.stakeText}>
              {tokenFormatter(stakingStats.SOL?.staked || 0, 'SOL')} staked • rewards {Number(stakingStats.SOL?.rewards || 0).toFixed(4)} SOL
            </Text>
            <Text style={styles.stakeText}>
              {tokenFormatter(stakingStats.FLAME?.staked || 0, 'FLAME')} staked • rewards {Number(stakingStats.FLAME?.rewards || 0).toFixed(4)} FLAME
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assets</Text>
          {assets.map((asset) => (
            <TouchableOpacity key={asset.symbol} style={styles.assetRow} onPress={() => navigation.navigate('Wallet')}>
              <View style={[styles.assetIcon, { backgroundColor: asset.color }]}>
                <Text style={styles.assetIconText}>{asset.symbol[0]}</Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetValueText}>
                  {asset.symbol === 'NGN'
                    ? currencyFormatter(asset.value)
                    : asset.symbol === 'USD'
                    ? currencyFormatter(asset.value, 'USD')
                    : tokenFormatter(asset.value, asset.symbol)}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 120
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20
    },
    greeting: {
      fontSize: 13,
      color: colors.textMuted
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 2
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    notifBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#ef4444',
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3
    },
    notifBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: 'bold'
    },
    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginHorizontal: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border
    },
    balanceLabel: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '500'
    },
    balanceValue: {
      fontSize: 38,
      fontWeight: '800',
      color: colors.text,
      marginTop: 8,
      letterSpacing: -0.5
    },
    balanceStats: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 18
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.cardAlt,
      borderRadius: 14,
      padding: 12
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted
    },
    statValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: 6
    },
    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 10
    },
    actionButton: {
      width: '47%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    actionIcon: {
      width: 50,
      height: 50,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8
    },
    actionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      marginHorizontal: 20,
      marginBottom: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text
    },
    rateText: {
      color: colors.textMuted,
      fontSize: 12
    },
    accountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    accountLabel: {
      fontSize: 13,
      color: colors.textMuted
    },
    accountValue: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4
    },
    accountBadge: {
      color: colors.success,
      fontWeight: '700'
    },
    inlineLink: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 14
    },
    inlineLinkText: {
      color: colors.primary,
      fontWeight: '700',
      marginRight: 6
    },
    stakeText: {
      color: colors.text,
      marginBottom: 8
    },
    assetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    assetIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center'
    },
    assetIconText: {
      color: colors.white,
      fontWeight: '700'
    },
    assetInfo: {
      flex: 1,
      marginLeft: 12
    },
    assetName: {
      color: colors.text,
      fontWeight: '600'
    },
    assetValueText: {
      color: colors.textMuted,
      marginTop: 2
    },
    priceDelta: {
      fontWeight: '700'
    }
  });
