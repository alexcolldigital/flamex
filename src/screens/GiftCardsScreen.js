import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { transactionAPI } from '../api/client';

const giftCards = [
  { id: 'amazon', name: 'Amazon', color: '#FF9900' },
  { id: 'apple', name: 'Apple', color: '#000000' },
  { id: 'google', name: 'Google Play', color: '#4285F4' },
  { id: 'steam', name: 'Steam', color: '#1b2838' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'spotify', name: 'Spotify', color: '#1DB954' },
];

const paymentTokens = [
  { symbol: 'NGN', name: 'Naira', color: '#4CAF50' },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF' },
  { id: 'usdt', name: 'USDT', color: '#26A17B' },
  { id: 'flame', name: 'FLAME', color: '#FF6B00' },
];

export default function GiftCardsScreen({ navigation }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentToken, setPaymentToken] = useState('NGN');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!selectedCard || !amount) {
      Alert.alert('Error', 'Please select a gift card and amount');
      return;
    }

    setLoading(true);
    try {
      const res = await transactionAPI.buyGiftCard({
        provider: selectedCard,
        amount: parseFloat(amount),
        currency: 'USD',
        paymentCurrency: paymentToken,
      });
      Alert.alert(
        'Success',
        `Gift card purchased!\nCode: ${res.data.cardCode}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Purchase failed');
    }
    setLoading(false);
  };

  const rates = {
    amazon: 1450, apple: 1400, google: 1350, steam: 1300,
    netflix: 1200, spotify: 1100
  };

  const calculateCost = () => {
    if (!amount || !selectedCard) return 0;
    const rate = rates[selectedCard] || 1400;
    return (parseFloat(amount) * rate).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Cards</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gift Card Selection */}
        <Text style={styles.sectionTitle}>Select Gift Card</Text>
        <View style={styles.cardsGrid}>
          {giftCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardButton,
                selectedCard === card.id && styles.cardButtonActive,
              ]}
              onPress={() => setSelectedCard(card.id)}
            >
              <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
                <Text style={styles.cardIconText}>{card.name[0]}</Text>
              </View>
              <Text style={styles.cardName}>{card.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount Input */}
        <Text style={styles.sectionTitle}>Amount (USD)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="10 - 500"
          placeholderTextColor="#666"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {[10, 25, 50, 100].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickAmountButton}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={styles.quickAmountText}>${amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cost Display */}
        {amount && selectedCard && (
          <View style={styles.costBox}>
            <Text style={styles.costLabel}>Total Cost</Text>
            <Text style={styles.costValue}>₦{calculateCost()}</Text>
            <Text style={styles.costRate}>Rate: ₦{rates[selectedCard] || 1400}/$1</Text>
          </View>
        )}

        {/* Payment Token */}
        <Text style={styles.sectionTitle}>Pay With</Text>
        <View style={styles.tokensRow}>
          {paymentTokens.map((token) => (
            <TouchableOpacity
              key={token.symbol}
              style={[
                styles.tokenButton,
                paymentToken === token.symbol && styles.tokenButtonActive,
              ]}
              onPress={() => setPaymentToken(token.symbol)}
            >
              <View style={[styles.tokenIcon, { backgroundColor: token.color }]}>
                <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
              </View>
              <Text style={styles.tokenName}>{token.symbol}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Buy Button */}
        <TouchableOpacity
          style={[styles.buyButton, loading && styles.buyButtonDisabled]}
          onPress={handleBuy}
          disabled={loading}
        >
          <Text style={styles.buyButtonText}>
            {loading ? 'Processing...' : 'Buy Gift Card'}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  cardButton: {
    width: '30%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cardButtonActive: {
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  amountInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  costBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  costRate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tokensRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tokenButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  tokenButtonActive: {
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  tokenIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  tokenName: {
    fontSize: 12,
    color: '#fff',
  },
  buyButton: {
    backgroundColor: '#FFB800',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

