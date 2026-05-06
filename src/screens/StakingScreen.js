import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { stakingAPI, walletAPI } from '../api/client';

const formatCrypto = (value, decimals = 4) => parseFloat(value).toFixed(decimals);

export default function StakingScreen() {
  const [pools, setPools] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [activeTab, setActiveTab] = useState('pools');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [poolsRes, stakesRes, walletRes] = await Promise.all([
        stakingAPI.getPools(),
        stakingAPI.getMyStakes(),
        walletAPI.getWallet(),
      ]);
      setPools(poolsRes.data);
      setStakes(stakesRes.data);
      setWallet(walletRes.data);
    } catch (error) {
      console.log('Load staking error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) < selectedPool.minStake) {
      Alert.alert('Error', `Minimum stake is ${selectedPool.minStake} ${selectedPool.token}`);
      return;
    }

    setLoading(true);
    try {
      await stakingAPI.createStake({
        token: selectedPool.token,
        amount: parseFloat(stakeAmount),
        apy: selectedPool.apy,
        lockPeriod: selectedPool.lockPeriod,
      });
      setSelectedPool(null);
      setStakeAmount('');
      await loadData();
      Alert.alert('Success', `Staked ${stakeAmount} ${selectedPool.token}!`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Staking failed');
    }
    setLoading(false);
  };

  const handleClaim = async (stakeId) => {
    try {
      await stakingAPI.claimRewards(stakeId);
      await loadData();
      Alert.alert('Success', 'Rewards claimed!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Claim failed');
    }
  };

  const handleUnstake = async (stake) => {
    Alert.alert(
      'Unstake',
      `Are you sure you want to unstake ${formatCrypto(stake.amount)} ${stake.token}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unstake',
          style: 'destructive',
          onPress: async () => {
            try {
              await stakingAPI.unstake(stake._id);
              await loadData();
              Alert.alert('Success', 'Unstaked successfully!');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Unstake failed');
            }
          },
        },
      ]
    );
  };

  const calculateRewards = (amount, apy, days) => {
    return amount * (apy / 100) * (days / 365);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pools' && styles.tabActive]}
          onPress={() => setActiveTab('pools')}
        >
          <Text style={[styles.tabText, activeTab === 'pools' && styles.tabTextActive]}>
            Pools
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stakes' && styles.tabActive]}
          onPress={() => setActiveTab('stakes')}
        >
          <Text style={[styles.tabText, activeTab === 'stakes' && styles.tabTextActive]}>
            My Stakes ({stakes.filter(s => s.status === 'active').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB800" />
        }
      >
        {activeTab === 'pools' ? (
          <View style={styles.content}>
            {pools.map((pool) => (
              <View key={pool.token} style={styles.poolCard}>
                <View style={styles.poolHeader}>
                  <View style={styles.poolInfo}>
                    <View style={[styles.poolIcon, { backgroundColor: pool.token === 'SOL' ? '#9945FF' : '#FF6B00' }]}>
                      <Text style={styles.poolIconText}>{pool.token[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.poolName}>{pool.token} Staking</Text>
                      <Text style={styles.poolMin}>Min: {pool.minStake} {pool.token}</Text>
                    </View>
                  </View>
                  <View style={styles.apyContainer}>
                    <Text style={styles.apyValue}>{pool.apy}%</Text>
                    <Text style={styles.apyLabel}>APY</Text>
                  </View>
                </View>

                <View style={styles.poolStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{formatCrypto(pool.totalStaked)}</Text>
                    <Text style={styles.statLabel}>Total Staked</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {pool.lockPeriod > 0 ? `${pool.lockPeriod}d` : 'None'}
                    </Text>
                    <Text style={styles.statLabel}>Lock</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {formatCrypto(wallet?.balances?.[pool.token] || 0)}
                    </Text>
                    <Text style={styles.statLabel}>Balance</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.stakeButton}
                  onPress={() => setSelectedPool(pool)}
                >
                  <Icon name="lock" size={18} color="#0a0a0a" />
                  <Text style={styles.stakeButtonText}>Stake {pool.token}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.infoCard}>
              <Icon name="information" size={20} color="#FFB800" />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>How Staking Works</Text>
                <Text style={styles.infoDesc}>
                  Stake tokens to earn passive rewards. FLAME has a 7-day lock period, SOL has no lock.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {stakes.filter(s => s.status === 'active').length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="lock-open" size={48} color="#666" />
                <Text style={styles.emptyTitle}>No active stakes</Text>
                <Text style={styles.emptyDesc}>Start staking to earn passive rewards</Text>
              </View>
            ) : (
              stakes.filter(s => s.status === 'active').map((stake) => (
                <View key={stake._id} style={styles.stakeCard}>
                  <View style={styles.stakeHeader}>
                    <View style={styles.stakeInfo}>
                      <View style={[styles.stakeIcon, { backgroundColor: stake.token === 'SOL' ? '#9945FF' : '#FF6B00' }]}>
                        <Text style={styles.stakeIconText}>{stake.token[0]}</Text>
                      </View>
                      <View>
                        <Text style={styles.stakeName}>{stake.token} Stake</Text>
                        <Text style={styles.stakeDate}>
                          {new Date(stake.startDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.apyBadge}>
                      <Text style={styles.apyBadgeText}>{stake.apy}% APY</Text>
                    </View>
                  </View>

                  <View style={styles.stakeAmounts}>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Staked</Text>
                      <Text style={styles.amountValue}>
                        {formatCrypto(stake.amount)} {stake.token}
                      </Text>
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Rewards</Text>
                      <Text style={[styles.amountValue, styles.rewardValue]}>
                        +{formatCrypto(stake.rewards)} {stake.token}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stakeActions}>
                    <TouchableOpacity
                      style={styles.claimButton}
                      onPress={() => handleClaim(stake._id)}
                    >
                      <Icon name="coins" size={16} color="#fff" />
                      <Text style={styles.claimButtonText}>Claim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.unstakeButton}
                      onPress={() => handleUnstake(stake)}
                    >
                      <Icon name="unlock" size={16} color="#f44336" />
                      <Text style={styles.unstakeButtonText}>Unstake</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Stake Modal */}
      <Modal
        visible={!!selectedPool}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPool(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stake {selectedPool?.token}</Text>
              <TouchableOpacity onPress={() => setSelectedPool(null)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfo}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>APY</Text>
                <Text style={styles.modalValue}>{selectedPool?.apy}%</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Lock Period</Text>
                <Text style={styles.modalValue}>
                  {selectedPool?.lockPeriod > 0 ? `${selectedPool.lockPeriod} days` : 'No lock'}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Amount to Stake</Text>
            <TextInput
              style={styles.input}
              placeholder={`Min: ${selectedPool?.minStake} ${selectedPool?.token}`}
              placeholderTextColor="#666"
              value={stakeAmount}
              onChangeText={setStakeAmount}
              keyboardType="decimal-pad"
            />

            {stakeAmount > 0 && (
              <View style={styles.estimateBox}>
                <Text style={styles.estimateTitle}>Estimated Rewards</Text>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Daily</Text>
                  <Text style={styles.estimateValue}>
                    {formatCrypto(calculateRewards(parseFloat(stakeAmount) || 0, selectedPool?.apy || 0, 1))} {selectedPool?.token}
                  </Text>
                </View>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Yearly</Text>
                  <Text style={[styles.estimateValue, styles.estimateHighlight]}>
                    {formatCrypto(calculateRewards(parseFloat(stakeAmount) || 0, selectedPool?.apy || 0, 365))} {selectedPool?.token}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleStake}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Staking...' : 'Confirm Stake'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    gap: 16,
  },
  poolCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  poolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  poolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poolIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  poolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  poolMin: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  apyContainer: {
    alignItems: 'flex-end',
  },
  apyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  apyLabel: {
    fontSize: 12,
    color: '#999',
  },
  poolStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  stakeButton: {
    flexDirection: 'row',
    backgroundColor: '#FFB800',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stakeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB800',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  stakeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  stakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stakeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stakeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stakeIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stakeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  stakeDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  apyBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  apyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB800',
  },
  stakeAmounts: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  amountBox: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rewardValue: {
    color: '#4CAF50',
  },
  stakeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  claimButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  unstakeButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  unstakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalInfo: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: '#999',
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  estimateBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  estimateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  estimateLabel: {
    fontSize: 14,
    color: '#999',
  },
  estimateValue: {
    fontSize: 14,
    color: '#fff',
  },
  estimateHighlight: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FFB800',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

