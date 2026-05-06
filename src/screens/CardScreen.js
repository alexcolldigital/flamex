import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { walletAPI } from '../api/client';
import { currencyFormatter } from '../lib/finance';
import { useAppTheme } from '../theme/ThemeProvider';

const cardColors = {
  purple: ['#7C3AED', '#4C1D95'],
  blue: ['#3B82F6', '#1E40AF'],
  green: ['#10B981', '#065F46'],
  orange: ['#F97316', '#9A3412']
};

export default function CardScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [wallet, setWallet] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedColor, setSelectedColor] = useState('purple');
  const [fundAmount, setFundAmount] = useState('10000');
  const [loading, setLoading] = useState(false);

  const loadWallet = async () => {
    try {
      const res = await walletAPI.getWallet();
      setWallet(res.data);
    } catch (error) {
      console.log('Load wallet error:', error);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const createCard = async () => {
    setLoading(true);
    try {
      await walletAPI.createVirtualCard({ color: selectedColor });
      await loadWallet();
    } catch (error) {
      console.log('Create card error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fundCard = async () => {
    setLoading(true);
    try {
      await walletAPI.fundCard({ amount: Number(fundAmount) });
      await loadWallet();
    } catch (error) {
      console.log('Fund card error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFreeze = async () => {
    setLoading(true);
    try {
      await walletAPI.freezeCard();
      await loadWallet();
    } catch (error) {
      console.log('Freeze card error:', error);
    } finally {
      setLoading(false);
    }
  };

  const card = wallet?.virtualCard;

  if (!card || !card.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Virtual Card</Text>
        </View>
        <View style={styles.emptyState}>
          <Icon name="credit-card-plus-outline" size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>Create your virtual card</Text>
          <Text style={styles.emptyDesc}>
            Generate a card, fund it from your NGN balance, and freeze or unfreeze it when needed.
          </Text>
          <View style={styles.colorRow}>
            {Object.keys(cardColors).map((colorKey) => (
              <TouchableOpacity
                key={colorKey}
                style={[
                  styles.colorChip,
                  { backgroundColor: cardColors[colorKey][0] },
                  selectedColor === colorKey && styles.colorChipActive
                ]}
                onPress={() => setSelectedColor(colorKey)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.createButton} onPress={createCard} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.createButtonText}>Create Virtual Card</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const palette = cardColors[card.color] || cardColors[selectedColor] || cardColors.purple;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Virtual Card</Text>
        <Text style={styles.headerSubtitle}>Spend online with wallet-funded NGN</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette[0] }]}>
          <View style={styles.cardHeader}>
            <View style={styles.chip} />
            <Text style={styles.cardType}>VISA</Text>
          </View>
          <Text style={styles.cardNumber}>
            {showDetails
              ? card.cardNumber?.replace(/(\d{4})(?=\d)/g, '$1 ')
              : `•••• •••• •••• ${card.cardNumber?.slice(-4)}`}
          </Text>
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardLabel}>CARD HOLDER</Text>
              <Text style={styles.cardValue}>{showDetails ? 'FlameX User' : '••••••••••••'}</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>
                {showDetails ? `${card.expiryMonth}/${card.expiryYear}` : '••/••'}
              </Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>CVV</Text>
              <Text style={styles.cardValue}>{showDetails ? card.cvv : '•••'}</Text>
            </View>
          </View>
          <View style={[styles.cardGradient, { backgroundColor: palette[1] }]} />
        </View>

        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Card Balance</Text>
            <Text style={styles.balanceValue}>{currencyFormatter(card.balance || 0)}</Text>
            <Text style={styles.balanceSubtext}>
              Wallet NGN balance: {currencyFormatter(wallet?.balances?.NGN || 0)}
            </Text>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={toggleFreeze} disabled={loading}>
            <Icon name={card.status === 'active' ? 'snowflake' : 'lock-open-variant'} size={20} color={colors.primary} />
            <Text style={styles.actionText}>{card.status === 'active' ? 'Freeze' : 'Unfreeze'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Fund Card</Text>
          <TextInput
            style={styles.input}
            value={fundAmount}
            onChangeText={setFundAmount}
            keyboardType="number-pad"
            placeholder="Enter amount"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.createButton} onPress={fundCard} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.createButtonText}>Fund from NGN balance</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowDetails((current) => !current)}>
            <Icon name={showDetails ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>{showDetails ? 'Hide details' : 'Show details'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Card Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{card.status === 'active' ? 'Active' : 'Frozen'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Card Type</Text>
            <Text style={styles.infoValue}>Visa prepaid</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Card ID</Text>
            <Text style={styles.infoValue}>{card.id}</Text>
          </View>
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
    header: {
      padding: 20
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text
    },
    headerSubtitle: {
      marginTop: 4,
      color: colors.textMuted
    },
    content: {
      flex: 1,
      padding: 20
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 24
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24
    },
    colorRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24
    },
    colorChip: {
      width: 32,
      height: 32,
      borderRadius: 16
    },
    colorChipActive: {
      borderWidth: 3,
      borderColor: colors.text
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 18,
      paddingHorizontal: 32,
      alignItems: 'center'
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.black
    },
    card: {
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      overflow: 'hidden'
    },
    cardGradient: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 200,
      height: 200,
      borderRadius: 100,
      opacity: 0.3,
      transform: [{ translateX: 100 }, { translateY: -100 }]
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 40
    },
    chip: {
      width: 48,
      height: 32,
      backgroundColor: '#FFD700',
      borderRadius: 4
    },
    cardType: {
      fontSize: 20,
      fontWeight: '700',
      color: '#fff',
      fontStyle: 'italic'
    },
    cardNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 2,
      marginBottom: 40
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    cardLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 4
    },
    cardValue: {
      fontSize: 14,
      color: '#fff',
      fontWeight: '500'
    },
    balanceCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    balanceLabel: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 4
    },
    balanceValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text
    },
    balanceSubtext: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6
    },
    actionButton: {
      flexDirection: 'row',
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      gap: 6
    },
    actionText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary
    },
    actionsGrid: {
      marginBottom: 20
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: '700'
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textMuted
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      maxWidth: '65%',
      textAlign: 'right'
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 14
    }
  });
