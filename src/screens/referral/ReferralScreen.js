import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useReferralStore } from '../../store/referralStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function ReferralScreen({ navigation }) {
  const { colors } = useAppTheme();
  const { unreadCount, initializeNotifications } = useNotificationStore();
  const {
    referralData,
    leaderboard,
    isLoading,
    fetchReferralData,
    fetchLeaderboard,
    claimRewards,
  } = useReferralStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchLeaderboard();
    initializeNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchReferralData(), fetchLeaderboard()]);
    setRefreshing(false);
  }, []);

  const handleShare = async () => {
    if (!referralData?.link) return;
    try {
      await Share.share({
        message: `Join me on FlameX! Use my referral code "${referralData.code}" when signing up and we both earn ₦${(referralData.bonusPerReferral || 500).toLocaleString()}.\n\n${referralData.link}`,
        title: 'Join FlameX',
      });
    } catch {}
  };

  const handleCopyCode = async () => {
    if (referralData?.code) {
      await Clipboard.setStringAsync(referralData.code);
      Alert.alert('Copied', 'Referral code copied to clipboard');
    }
  };

  const handleCopyLink = async () => {
    if (referralData?.link) {
      await Clipboard.setStringAsync(referralData.link);
      Alert.alert('Copied', 'Referral link copied to clipboard');
    }
  };

  const handleClaimRewards = async () => {
    if (!referralData?.pendingRewards || referralData.pendingRewards <= 0) return;
    setClaiming(true);
    try {
      await claimRewards();
      Alert.alert('Success', `₦${referralData.pendingRewards.toLocaleString()} has been added to your NGN wallet`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to claim rewards');
    }
    setClaiming(false);
  };

  const fmt = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.codeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{referralData?.code || '—'}</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.iconBtn}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.linkRow}>
          <TouchableOpacity onPress={handleCopyLink} style={[styles.linkBtn, { backgroundColor: colors.background }]}>
            <Ionicons name="link-outline" size={16} color={colors.primary} />
            <Text style={[styles.linkBtnText, { color: colors.primary }]}>Copy Link</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.shareBtn, { backgroundColor: colors.background }]}>
            <Ionicons name="share-outline" size={16} color={colors.primary} />
            <Text style={[styles.linkBtnText, { color: colors.primary }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="gift-outline" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          Earn <Text style={[styles.infoHighlight, { color: colors.primary }]}>{fmt(referralData?.bonusPerReferral || 500)}</Text> for every friend who signs up with your code
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {[['totalReferrals', 'Total Referrals'], ['activeReferrals', 'Active Users']].map(([key, label]) => (
          <View key={key} style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{referralData?.[key] || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
          </View>
        ))}
        {[['totalRewards', 'Total Earned'], ['claimedRewards', 'Claimed']].map(([key, label]) => (
          <View key={key} style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{fmt(referralData?.[key])}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.rewardsCard, { backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.rewardsLabel, { color: colors.textMuted }]}>Pending Rewards</Text>
          <Text style={[styles.rewardsValue, { color: colors.success }]}>{fmt(referralData?.pendingRewards)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.claimBtn, { backgroundColor: colors.success }, (!referralData?.pendingRewards || referralData.pendingRewards <= 0) && { backgroundColor: colors.border }]}
          onPress={handleClaimRewards}
          disabled={!referralData?.pendingRewards || referralData.pendingRewards <= 0 || claiming}
        >
          {claiming ? (
            <ActivityIndicator size="small" color={colors.black} />
          ) : (
            <Text style={[styles.claimBtnText, { color: colors.black }]}>Claim to Wallet</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReferralsTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Referred Users</Text>
      {!referralData?.referredUsers?.length ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No referrals yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Share your code to start earning ₦{(referralData?.bonusPerReferral || 500).toLocaleString()} per referral</Text>
        </View>
      ) : (
        referralData.referredUsers.map((u, i) => (
          <View key={i} style={[styles.referralItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.black }]}>{u.username?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.referralInfo}>
              <Text style={[styles.referralName, { color: colors.text }]}>@{u.username || 'Unknown'}</Text>
              <Text style={[styles.referralDate, { color: colors.textMuted }]}>Joined {new Date(u.joinedAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.referralRight}>
              <View style={[styles.statusBadge, { backgroundColor: u.status === 'active' ? colors.success : colors.border }]}>
                <Text style={styles.statusText}>{u.status === 'active' ? 'Active' : 'Inactive'}</Text>
              </View>
              <Text style={[styles.referralEarned, { color: colors.success }]}>{fmt(u.rewardsEarned)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderLeaderboardTab = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Referrers</Text>
      {leaderboard.map((entry, i) => (
        <View key={i} style={[styles.leaderboardItem, { backgroundColor: colors.surface }]}>
          <View style={styles.rankContainer}>
            {i < 3 ? (
              <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32' }]}>
                <Ionicons name="trophy" size={14} color="#0a0a0f" />
              </View>
            ) : (
              <Text style={[styles.rankNumber, { color: colors.textMuted }]}>#{i + 1}</Text>
            )}
          </View>
          <View style={[styles.leaderboardAvatar, { backgroundColor: colors.cardAlt }]}>
            <Text style={[styles.leaderboardAvatarText, { color: colors.text }]}>{entry.username?.charAt(0).toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.leaderboardInfo}>
            <Text style={[styles.leaderboardName, { color: colors.text }]}>@{entry.username || 'Unknown'}</Text>
            <Text style={[styles.leaderboardSub, { color: colors.textMuted }]}>{entry.totalReferrals} referrals</Text>
          </View>
          <Text style={[styles.leaderboardEarnings, { color: colors.primary }]}>{fmt(entry.totalRewards)}</Text>
        </View>
      ))}
    </View>
  );

  if (isLoading && !referralData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Referral Program</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Invite friends and earn ₦{(referralData?.bonusPerReferral || 500).toLocaleString()} per referral</Text>
          </View>
          <TouchableOpacity style={[styles.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {['overview', 'referrals', 'leaderboard'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.primary }]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textMuted }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'referrals' && renderReferralsTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  notifBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#f59e0b' },
  tabText: { fontSize: 13, color: '#888', fontWeight: '500' },
  activeTabText: { color: '#f59e0b' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
  tabContent: { padding: 16 },
  codeCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  codeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 },
  codeText: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  linkRow: { flexDirection: 'row', gap: 10 },
  linkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', paddingVertical: 10, borderRadius: 8, gap: 6 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0f', paddingVertical: 10, borderRadius: 8, gap: 6 },
  linkBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 16, gap: 10 },
  infoText: { flex: 1, color: '#aaa', fontSize: 13, lineHeight: 20 },
  infoHighlight: { color: '#f59e0b', fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#f59e0b' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  rewardsCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardsLabel: { fontSize: 12, color: '#888' },
  rewardsValue: { fontSize: 24, fontWeight: 'bold', color: '#22c55e', marginTop: 4 },
  claimBtn: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  claimBtnDisabled: { backgroundColor: '#333' },
  claimBtnText: { color: '#0a0a0f', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#fff', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'center' },
  referralItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#0a0a0f' },
  referralInfo: { flex: 1, marginLeft: 12 },
  referralName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  referralDate: { fontSize: 12, color: '#666', marginTop: 2 },
  referralRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  statusText: { fontSize: 10, color: '#fff', fontWeight: '500' },
  referralEarned: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 8 },
  rankContainer: { width: 36, alignItems: 'center' },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankNumber: { fontSize: 14, fontWeight: '600', color: '#888' },
  leaderboardAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  leaderboardAvatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  leaderboardInfo: { flex: 1, marginLeft: 12 },
  leaderboardName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  leaderboardSub: { fontSize: 12, color: '#666', marginTop: 2 },
  leaderboardEarnings: { fontSize: 14, fontWeight: 'bold', color: '#f59e0b' },
});
