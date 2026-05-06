import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';

const QUICK_ACTIONS = [
  { id: 'deposit', icon: 'arrow-down', label: 'Deposit', color: '#10b981', screen: 'Deposit' },
  { id: 'withdraw', icon: 'arrow-up', label: 'Withdraw', color: '#ef4444', screen: 'Withdraw' },
  { id: 'transfer', icon: 'send', label: 'Transfer', color: '#f59e0b', screen: 'Transfer' },
  { id: 'swap', icon: 'swap-horizontal', label: 'Swap', color: '#8b5cf6', screen: 'Swap' }
];

const FEATURES = [
  { id: 'bills', icon: 'flash', label: 'Bills', color: '#f59e0b' },
  { id: 'giftcards', icon: 'gift', label: 'Gift Cards', color: '#ec4899' },
  { id: 'staking', icon: 'trending-up', label: 'Staking', color: '#10b981' },
  { id: 'history', icon: 'time', label: 'History', color: '#6b7280' }
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { balances, fetchBalances } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.token) await fetchBalances(user.token);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.token) fetchBalances(user.token);
  }, [user]);

  const formatCurrency = (amount) => hideBalance ? '****' : `$${(amount || 0).toLocaleString()}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.gradient}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Settings')}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.avatarGradient}>
                  <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View>
                <Text style={styles.greeting}>Good day,</Text>
                <Text style={styles.userName}>{user?.firstName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <LinearGradient colors={['#f59e0b', '#d97706', '#b45309']} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
                <Ionicons name={hideBalance ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(0)}</Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>NGN</Text>
                <Text style={styles.balanceItemValue}>{hideBalance ? '****' : `₦${(balances.ngnBalance || 0).toLocaleString()}`}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>Crypto</Text>
                <Text style={styles.balanceItemValue}>{hideBalance ? '****' : '$0.00'}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map(action => (
                <TouchableOpacity key={action.id} style={styles.actionButton} onPress={() => navigation.navigate(action.screen)}>
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More Features</Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map(feature => (
                <TouchableOpacity key={feature.id} style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                    <Ionicons name={feature.icon} size={24} color={feature.color} />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { marginRight: 12 },
  avatarGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#0a0a0f', fontSize: 16, fontWeight: 'bold' },
  greeting: { color: '#9ca3af', fontSize: 13 },
  userName: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  notificationBtn: { padding: 8 },
  balanceCard: { margin: 20, marginTop: 0, borderRadius: 24, padding: 24 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceAmount: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  balanceFooter: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1 },
  balanceItemLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 },
  balanceItemValue: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  section: { padding: 20, paddingTop: 0 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { alignItems: 'center' },
  actionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { color: '#ffffff', fontSize: 12 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: '23%', alignItems: 'center' },
  featureIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  featureLabel: { color: '#ffffff', fontSize: 11, textAlign: 'center' }
});

export default HomeScreen;
