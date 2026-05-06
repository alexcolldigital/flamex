import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { p2pAPI } from '../../api/client';
import { p2pAmount, p2pMoney } from '../../lib/p2p';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const TABS = [
  { id: 'market', label: 'Market' },
  { id: 'orders', label: 'Orders' },
  { id: 'offers', label: 'Offers' },
  { id: 'disputes', label: 'Disputes' }
];

export default function P2PScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState('market');
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchUserProfile();
      const [offersRes, ordersRes, myOffersRes, disputesRes] = await Promise.all([
        p2pAPI.getOffers({ status: 'open' }),
        p2pAPI.getOrders(),
        p2pAPI.getMyOffers(),
        p2pAPI.getDisputes({ scope: 'all' })
      ]);
      setOffers(offersRes.data.offers || []);
      setOrders(ordersRes.data.orders || []);
      setMyOffers(myOffersRes.data.offers || []);
      setDisputes(disputesRes.data.disputes || []);
      setAdmin(Boolean(disputesRes.data.admin));
    } catch (error) {
      console.log('Load P2P screen error:', error);
      setOffers([]);
      setOrders([]);
      setMyOffers([]);
      setDisputes([]);
      setAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderOfferCard = (offer, mine = false) => (
    <View key={offer.id} style={styles.card}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.cardTitle}>
            {offer.side === 'sell' ? 'Sell' : 'Buy'} {offer.asset}
          </Text>
          <Text style={styles.cardSubtle}>
            {offer.creator?.username ? `@${offer.creator.username}` : 'P2P trader'}
          </Text>
        </View>
        <View style={[styles.badge, offer.side === 'sell' ? styles.sellBadge : styles.buyBadge]}>
          <Text style={styles.badgeText}>{offer.side.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Rate</Text>
        <Text style={styles.metricValue}>{p2pMoney(offer.price)}/{offer.asset}</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Available</Text>
        <Text style={styles.metricValue}>{p2pAmount(offer.availableAmount, 6)} {offer.asset}</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Order range</Text>
        <Text style={styles.metricValue}>
          {p2pAmount(offer.minOrderAmount, 6)} - {p2pAmount(offer.maxOrderAmount, 6)} {offer.asset}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('P2POrderDetails', { offer })}
      >
        <Text style={styles.primaryButtonText}>{mine ? 'View offer' : 'Open offer'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrderCard = (order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.card}
      onPress={() => navigation.navigate('P2POrderDetails', { orderId: order.id })}
    >
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.cardTitle}>{order.asset} order</Text>
          <Text style={styles.cardSubtle}>{order.reference}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Crypto</Text>
        <Text style={styles.metricValue}>{p2pAmount(order.cryptoAmount, 6)} {order.asset}</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Fiat</Text>
        <Text style={styles.metricValue}>{p2pMoney(order.fiatAmount)}</Text>
      </View>
      <Text style={styles.cardSubtle}>
        {order.isBuyer ? 'You are buying crypto' : 'You are selling crypto'}
      </Text>
    </TouchableOpacity>
  );

  const renderDisputeCard = (dispute) => (
    <View key={dispute._id} style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>Dispute</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{dispute.status}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtle}>{dispute.reason}</Text>
      <Text style={styles.cardSubtle}>{new Date(dispute.createdAt).toLocaleString()}</Text>
    </View>
  );

  const currentContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
    }

    if (tab === 'market') {
      return offers.length ? offers.map((offer) => renderOfferCard(offer)) : <Text style={styles.emptyText}>No open P2P offers yet.</Text>;
    }
    if (tab === 'orders') {
      return orders.length ? orders.map((order) => renderOrderCard(order)) : <Text style={styles.emptyText}>You do not have active P2P orders yet.</Text>;
    }
    if (tab === 'offers') {
      return myOffers.length ? myOffers.map((offer) => renderOfferCard(offer, true)) : <Text style={styles.emptyText}>Create your first offer to start trading.</Text>;
    }
    return disputes.length ? disputes.map((dispute) => renderDisputeCard(dispute)) : <Text style={styles.emptyText}>{admin ? 'No disputes are open right now.' : 'You do not have any disputes.'}</Text>;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>P2P Crypto</Text>
        <TouchableOpacity style={styles.createChip} onPress={() => navigation.navigate('P2PCreateOffer')}>
          <Ionicons name="add" size={18} color={colors.black} />
          <Text style={styles.createChipText}>Offer</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balancePanel}>
          <Text style={styles.balanceLabel}>P2P balances</Text>
          <Text style={styles.balanceValue}>Available NGN {p2pMoney(user?.balances?.NGN || 0)}</Text>
          <Text style={styles.balanceMuted}>
            Locked USDT {p2pAmount(user?.lockedBalances?.USDT || 0, 6)} • Locked SOL {p2pAmount(user?.lockedBalances?.SOL || 0, 6)}
          </Text>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.tabButton, tab === item.id && styles.tabButtonActive]}
              onPress={() => setTab(item.id)}
            >
              <Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>{currentContent()}</View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    createChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    createChipText: { color: colors.black, fontWeight: '700' },
    scrollView: { flex: 1 },
    balancePanel: { backgroundColor: colors.surface, margin: 16, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border },
    balanceLabel: { color: colors.textMuted, fontSize: 13 },
    balanceValue: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 6 },
    balanceMuted: { color: colors.textMuted, marginTop: 6 },
    tabsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, flexWrap: 'wrap' },
    tabButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tabButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabText: { color: colors.textMuted, fontWeight: '600' },
    tabTextActive: { color: colors.black },
    content: { padding: 16 },
    loader: { marginTop: 40 },
    card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
    cardSubtle: { color: colors.textMuted, marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    sellBadge: { backgroundColor: colors.dangerSoft },
    buyBadge: { backgroundColor: colors.successSoft },
    badgeText: { color: colors.text, fontSize: 12, fontWeight: '700' },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    metricLabel: { color: colors.textMuted },
    metricValue: { color: colors.text, fontWeight: '600' },
    primaryButton: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
    primaryButtonText: { color: colors.black, fontWeight: '700' },
    statusPill: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    statusText: { color: colors.primary, fontWeight: '700', textTransform: 'capitalize' },
    emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 28 }
  });
