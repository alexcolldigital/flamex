import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';

const C = {
  bg: '#080B12', card: '#111722', border: '#1E293B',
  text: '#FFFFFF', muted: '#94A3B8', sub: '#475569',
  green: '#22C55E', greenSoft: 'rgba(34,197,94,0.12)',
  red: '#EF4444', amber: '#F59E0B',
};

const QUICK_ACTIONS = [
  { id: 'deposit',  icon: 'arrow-down',       label: 'Deposit',  color: C.green,  screen: 'Deposit' },
  { id: 'withdraw', icon: 'arrow-up',          label: 'Withdraw', color: C.red,    screen: 'Withdraw' },
  { id: 'transfer', icon: 'send',              label: 'Transfer', color: C.amber,  screen: 'Transfer' },
  { id: 'swap',     icon: 'swap-horizontal',   label: 'Swap',     color: '#8B5CF6', screen: 'Swap' },
];

const FEATURES = [
  { id: 'bills',     icon: 'flash',       label: 'Bills',      color: C.amber,   screen: 'Bills' },
  { id: 'giftcards', icon: 'gift',        label: 'Gift Cards', color: '#EC4899', screen: 'GiftCards' },
  { id: 'p2p',       icon: 'people',      label: 'P2P',        color: '#3B82F6', screen: 'P2P' },
  { id: 'cards',     icon: 'card',        label: 'Cards',      color: '#8B5CF6', screen: 'Cards' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore();
  const { balances, fetchBalances } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    if (user?.token) fetchBalances(user.token);
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.token) await fetchBalances(user.token);
    setRefreshing(false);
  };

  const fmt = (n) => hideBalance ? '••••••' : `₦${(n || 0).toLocaleString()}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{user?.firstName}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
              <Ionicons name={hideBalance ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.muted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{fmt(balances.ngnBalance)}</Text>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceSubLabel}>NGN Balance</Text>
              <Text style={styles.balanceSubValue}>{fmt(balances.ngnBalance)}</Text>
            </View>
            <View style={styles.balanceSep} />
            <View>
              <Text style={styles.balanceSubLabel}>Crypto (USD)</Text>
              <Text style={styles.balanceSubValue}>{hideBalance ? '••••' : '$0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.id} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen)}>
                <View style={[styles.actionIcon, { backgroundColor: `${a.color}18` }]}>
                  <Ionicons name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map(f => (
              <TouchableOpacity
                key={f.id}
                style={styles.featureCard}
                onPress={() => f.screen && navigation.navigate(f.screen)}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${f.color}18` }]}>
                  <Ionicons name={f.icon} size={22} color={f.color} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security indicator */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={16} color={C.green} />
          <Text style={styles.securityText}>256-bit encrypted · Non-custodial</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100, flexGrow: 1 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.greenSoft,
    borderWidth: 1.5, borderColor: C.green,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: C.green, fontSize: 15, fontWeight: '700' },
  headerMid: { flex: 1, marginLeft: 12 },
  greeting: { fontSize: 12, color: C.muted },
  userName: { fontSize: 17, fontWeight: '700', color: C.text },
  notifBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },

  balanceCard: {
    margin: 20, marginTop: 12,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1, borderColor: C.border,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  balanceLabel: { fontSize: 13, color: C.muted, fontWeight: '500' },
  balanceAmount: { fontSize: 38, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  balanceDivider: { height: 1, backgroundColor: C.border, marginVertical: 18 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceSubLabel: { fontSize: 11, color: C.sub, marginBottom: 4 },
  balanceSubValue: { fontSize: 15, fontWeight: '600', color: C.text },
  balanceSep: { width: 1, height: 32, backgroundColor: C.border, marginHorizontal: 24 },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16, letterSpacing: 0.1 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 54, height: 54, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 12, color: C.muted, fontWeight: '500' },

  featuresGrid: { flexDirection: 'row', gap: 12 },
  featureCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  featureIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  featureLabel: { fontSize: 11, color: C.muted, fontWeight: '500', textAlign: 'center' },

  securityBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 8,
  },
  securityText: { fontSize: 12, color: C.sub },
});
