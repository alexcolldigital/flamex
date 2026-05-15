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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useReferralStore } from '../../store/referralStore';
import { useAuthStore } from '../../store/authStore';

const TIERS = {
  bronze: { name: 'Bronze', percentage: 10, minReferrals: 0, color: '#cd7f32' },
  silver: { name: 'Silver', percentage: 15, minReferrals: 5, color: '#c0c0c0' },
  gold: { name: 'Gold', percentage: 20, minReferrals: 15, color: '#ffd700' },
  platinum: { name: 'Platinum', percentage: 25, minReferrals: 50, color: '#e5e4e2' },
  diamond: { name: 'Diamond', percentage: 30, minReferrals: 100, color: '#b9f2ff' },
};

export default function ReferralScreen({ navigation }) {
  const { user } = useAuthStore();
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchReferralData(), fetchLeaderboard()]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleShare = async () => {
    if (referralData?.link) {
      try {
        await Share.share({
          message: `Join me on FlameX - the ultimate multi-chain crypto wallet! Use my referral code "${referralData.code}" to get started.\n\n${referralData.link}`,
          title: 'Join FlameX',
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const handleCopyCode = () => {
    if (referralData?.code) {
      Clipboard.setStringAsync(referralData.code);
    }
  };

  const handleCopyLink = () => {
    if (referralData?.link) {
      Clipboard.setStringAsync(referralData.link);
    }
  };

  const handleClaimRewards = async () => {
    if (referralData?.pendingRewards > 0) {
      await claimRewards();
    }
  };

  const getCurrentTier = () => {
    return TIERS[referralData?.tier || 'bronze'];
  };

  const getNextTier = () => {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tierOrder.indexOf(referralData?.tier || 'bronze');
    if (currentIndex < tierOrder.length - 1) {
      return TIERS[tierOrder[currentIndex + 1]];
    }
    return null;
  };

  const getProgressToNextTier = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    
    const currentReferrals = referralData?.totalReferrals || 0;
    const required = nextTier.minReferrals - currentTier.minReferrals;
    const progress = currentReferrals - currentTier.minReferrals;
    return Math.min((progress / required) * 100, 100);
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Referral Code Card */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.codeCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{referralData?.code || 'Loading...'}</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
            <Ionicons name="copy-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={18} color="#f59e0b" />
          <Text style={styles.shareText}>Share with Friends</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{referralData?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{referralData?.activeReferrals || 0}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${(referralData?.totalRewards || 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Rewards</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getCurrentTier().percentage}%</Text>
          <Text style={styles.statLabel}>Commission</Text>
        </View>
      </View>

      {/* Pending Rewards */}
      <View style={styles.rewardsCard}>
        <View style={styles.rewardsHeader}>
          <View>
            <Text style={styles.rewardsLabel}>Pending Rewards</Text>
            <Text style={styles.rewardsValue}>
              ${(referralData?.pendingRewards || 0).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.claimButton,
              (!referralData?.pendingRewards || referralData.pendingRewards <= 0) &&
                styles.claimButtonDisabled,
            ]}
            onPress={handleClaimRewards}
            disabled={!referralData?.pendingRewards || referralData.pendingRewards <= 0}
          >
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tier Progress */}
      <View style={styles.tierCard}>
        <View style={styles.tierHeader}>
          <Text style={styles.tierTitle}>Current Tier</Text>
          <View style={[styles.tierBadge, { backgroundColor: getCurrentTier().color }]}>
            <Text style={styles.tierBadgeText}>{getCurrentTier().name}</Text>
          </View>
        </View>
        
        {getNextTier() ? (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressToNextTier()}%`, backgroundColor: getCurrentTier().color },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {referralData?.totalReferrals || 0} / {getNextTier().minReferrals} referrals
              </Text>
            </View>
            <Text style={styles.nextTierText}>
              Next: {getNextTier().name} ({getNextTier().percentage}% commission)
            </Text>
          </>
        ) : (
          <Text style={styles.maxTierText}>You've reached the highest tier!</Text>
        )}
      </View>

      {/* Tier Benefits */}
      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>Tier Benefits</Text>
        {Object.entries(TIERS).map(([key, tier]) => (
          <View key={key} style={styles.benefitRow}>
            <View style={[styles.benefitDot, { backgroundColor: tier.color }]} />
            <Text style={styles.benefitName}>{tier.name}</Text>
            <Text style={styles.benefitRequirement}>{tier.minReferrals}+ referrals</Text>
            <Text style={styles.benefitPercentage}>{tier.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReferralsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Your Referred Users</Text>
      {referralData?.referredUsers?.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No referrals yet</Text>
          <Text style={styles.emptySubtext}>
            Share your code to start earning rewards
          </Text>
        </View>
      ) : (
        referralData?.referredUsers?.map((referredUser, index) => (
          <View key={index} style={styles.referralItem}>
            <View style={styles.referralAvatar}>
              <Text style={styles.referralAvatarText}>
                {referredUser.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.referralInfo}>
              <Text style={styles.referralName}>@{referredUser.username || 'Unknown'}</Text>
              <Text style={styles.referralDate}>
                Joined {new Date(referredUser.joinedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.referralStatus}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: referredUser.status === 'active' ? '#22c55e' : '#666' },
                ]}
              >
                <Text style={styles.statusText}>
                  {referredUser.status === 'active' ? 'Active' : 'Pending'}
                </Text>
              </View>
              <Text style={styles.referralEarnings}>
                +${(referredUser.rewardsEarned || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderLeaderboardTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Top Referrers</Text>
      {leaderboard.map((entry, index) => (
        <View key={entry.userId} style={styles.leaderboardItem}>
          <View style={styles.rankContainer}>
            {index < 3 ? (
              <View
                style={[
                  styles.rankBadge,
                  {
                    backgroundColor:
                      index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                  },
                ]}
              >
                <Ionicons name="trophy" size={14} color="#0a0a0f" />
              </View>
            ) : (
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            )}
          </View>
          <View style={styles.leaderboardAvatar}>
            <Text style={styles.leaderboardAvatarText}>
              {entry.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.leaderboardInfo}>
            <Text style={styles.leaderboardName}>@{entry.username || 'Unknown'}</Text>
            <Text style={styles.leaderboardReferrals}>
              {entry.totalReferrals} referrals
            </Text>
          </View>
          <Text style={styles.leaderboardEarnings}>
            ${entry.totalRewards.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );

  if (isLoading && !referralData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.header}>
        <Text style={styles.headerTitle}>Referral Program</Text>
        <Text style={styles.headerSubtitle}>Earn rewards by inviting friends</Text>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'referrals' && styles.activeTab]}
          onPress={() => setActiveTab('referrals')}
        >
          <Text style={[styles.tabText, activeTab === 'referrals' && styles.activeTabText]}>
            My Referrals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'referrals' && renderReferralsTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#f59e0b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  tabContent: {
    padding: 16,
  },
  codeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0f',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  rewardsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsLabel: {
    fontSize: 12,
    color: '#888',
  },
  rewardsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 4,
  },
  claimButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  claimButtonDisabled: {
    backgroundColor: '#333',
  },
  claimButtonText: {
    color: '#0a0a0f',
    fontSize: 14,
    fontWeight: '600',
  },
  tierCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierTitle: {
    fontSize: 14,
    color: '#888',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    color: '#0a0a0f',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
  },
  nextTierText: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
  },
  maxTierText: {
    fontSize: 14,
    color: '#22c55e',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  benefitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  benefitName: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  benefitRequirement: {
    fontSize: 12,
    color: '#888',
    marginRight: 12,
  },
  benefitPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0f',
  },
  referralInfo: {
    flex: 1,
    marginLeft: 12,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  referralDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  referralStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  referralEarnings: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  leaderboardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  leaderboardReferrals: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  leaderboardEarnings: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
});
