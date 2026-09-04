import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { billsAPI } from '../../api/client';
import { amountForBillTransaction, BILL_CATEGORIES, BILL_ICON_MAP, titleForBillTransaction } from '../../lib/bills';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function BillsScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await fetchUserProfile();
      const response = await billsAPI.getHistory({ limit: 5 });
      setHistory(response.data.transactions || []);
    } catch (error) {
      console.log('Load bills screen error:', error);
      setHistory([]);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bills & Payments</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available NGN Balance</Text>
          <Text style={styles.balanceValue}>N{Number(user?.balances?.NGN || 0).toLocaleString()}</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {BILL_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate(category.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
                <Ionicons name={category.icon} size={28} color={category.color} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
          </View>

          <View style={styles.recentList}>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>No recent bill payments yet.</Text>
            ) : (
              history.map((item) => {
                const meta = BILL_ICON_MAP[item.type] || BILL_ICON_MAP.airtime;
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.recentItem}
                    onPress={() => navigation.navigate('TransactionDetails', { transaction: item })}
                  >
                    <View style={[styles.recentIcon, { backgroundColor: `${meta.color}20` }]}>
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentName}>{titleForBillTransaction(item)}</Text>
                      <Text style={styles.recentDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.recentAmount}>{amountForBillTransaction(item)}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.infoTitle}>Real Payment Flows</Text>
          <Text style={styles.infoText}>
            Airtime, data, electricity, and cable submit through the backend API with PIN confirmation. Gift cards are submitted for manual admin review before wallet credit.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: 16,
      paddingBottom: 16
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text
    },
    placeholder: {
      width: 40
    },
    scrollView: {
      flex: 1
    },
    content: {
      flexGrow: 1,
      paddingBottom: 120
    },
    balanceCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    balanceLabel: {
      fontSize: 13,
      color: colors.textMuted
    },
    balanceValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.success,
      marginTop: 4
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 12
    },
    categoryCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4
    },
    categoryDescription: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center'
    },
    recentSection: {
      paddingHorizontal: 16,
      marginTop: 8
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text
    },
    recentList: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    recentIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center'
    },
    recentInfo: {
      flex: 1,
      marginLeft: 12
    },
    recentName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text
    },
    recentDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2
    },
    recentAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text
    },
    emptyText: {
      color: colors.textMuted
    },
    infoCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 32,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginTop: 8
    },
    infoText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 18
    }
  });
