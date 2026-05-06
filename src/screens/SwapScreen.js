import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { walletAPI, priceAPI } from '../api/client';

const formatCrypto = (value, decimals = 4) => parseFloat(value || 0).toFixed(decimals);

export default function SwapScreen() {
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [fromToken, setFromToken] = useState('NGN');
  const [toToken, setToToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const tokens = [
    { symbol: 'NGN', name: 'Nigerian Naira', color: '#4CAF50' },
    { symbol: 'SOL', name: 'Solana', color: '#9945FF' },
    { symbol: 'USDT', name: 'Tether USD', color: '#26A17B' },
    { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
    { symbol: 'FLAME', name: 'Flame Token', color: '#FF6B00' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, pricesRes] = await Promise.all([
        walletAPI.getWallet(),
        priceAPI.getPrices(),
      ]);
      setWallet(walletRes.data);
      setPrices(pricesRes.data);
    } catch (error) {
      console.log('Load data error:', error);
    }
  };

  const getPriceInNgn = (symbol) => {
    if (symbol === 'NGN') return 1;
    return prices[symbol]?.ngn || 0;
  };

  const calculateReceiveAmount = () => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    const fromPrice = getPriceInNgn(fromToken);
    const toPrice = getPriceInNgn(toToken);
    if (fromPrice === 0 || toPrice === 0) return '0';
    const ngnValue = parseFloat(amount) * fromPrice;
    const receiveAmount = ngnValue / toPrice;
    const fee = receiveAmount * 0.005;
    return (receiveAmount - fee).toFixed(6);
  };

  const getExchangeRate = () => {
    const fromPrice = getPriceInNgn(fromToken);
    const toPrice = getPriceInNgn(toToken);
    if (fromPrice === 0 || toPrice === 0) return '0';
    return (fromPrice / toPrice).toFixed(6);
  };

  const handleSwap = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const balance = wallet?.balances?.[fromToken] || 0;
    if (numAmount > balance) {
      Alert.alert('Error', `Insufficient ${fromToken} balance`);
      return;
    }

    setLoading(true);
    try {
      await walletAPI.swap({
        fromCurrency: fromToken,
        toCurrency: toToken,
        amount: numAmount,
        receiveAmount: parseFloat(calculateReceiveAmount()),
      });
      await loadData();
      setAmount('');
      Alert.alert('Success', 'Swap completed!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Swap failed');
    }
    setLoading(false);
  };

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
  };

  const handleMax = () => {
    setAmount((wallet?.balances?.[fromToken] || 0).toString());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Swap</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* From Token */}
        <View style={styles.tokenCard}>
          <View style={styles.tokenHeader}>
            <Text style={styles.tokenLabel}>From</Text>
            <TouchableOpacity onPress={handleMax}>
              <Text style={styles.balanceText}>
                Balance: {formatCrypto(wallet?.balances?.[fromToken])} {fromToken}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.tokenSelector}>
              <View style={[styles.tokenIcon, { backgroundColor: tokens.find(t => t.symbol === fromToken)?.color }]}>
                <Text style={styles.tokenIconText}>{fromToken[0]}</Text>
              </View>
              <Text style={styles.tokenSymbol}>{fromToken}</Text>
            </View>
          </View>

          <Text style={styles.valueText}>
            ≈ ₦{(parseFloat(amount || 0) * getPriceInNgn(fromToken)).toLocaleString()}
          </Text>
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton} onPress={handleSwapTokens}>
          <View style={styles.swapIcon}>
            <Icon name="swap-vertical" size={24} color="#0a0a0a" />
          </View>
        </TouchableOpacity>

        {/* To Token */}
        <View style={styles.tokenCard}>
          <View style={styles.tokenHeader}>
            <Text style={styles.tokenLabel}>To</Text>
            <Text style={styles.balanceText}>
              Balance: {formatCrypto(wallet?.balances?.[toToken])} {toToken}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              value={calculateReceiveAmount()}
              editable={false}
              placeholderTextColor="#666"
            />
            <View style={styles.tokenSelector}>
              <View style={[styles.tokenIcon, { backgroundColor: tokens.find(t => t.symbol === toToken)?.color }]}>
                <Text style={styles.tokenIconText}>{toToken[0]}</Text>
              </View>
              <Text style={styles.tokenSymbol}>{toToken}</Text>
            </View>
          </View>

          <Text style={styles.valueText}>
            ≈ ₦{(parseFloat(calculateReceiveAmount() || 0) * getPriceInNgn(toToken)).toLocaleString()}
          </Text>
        </View>

        {/* Rate Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Exchange Rate</Text>
            <Text style={styles.infoValue}>1 {fromToken} = {getExchangeRate()} {toToken}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform Fee (0.5%)</Text>
            <Text style={styles.infoValue}>
              {formatCrypto(parseFloat(calculateReceiveAmount()) * 0.005)} {toToken}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network</Text>
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Solana</Text>
            </View>
          </View>
        </View>

        {/* Token Selectors */}
        <View style={styles.selectorsContainer}>
          <Text style={styles.selectorsTitle}>Select Tokens</Text>
          <View style={styles.tokenGrid}>
            {tokens.map((token) => (
              <TouchableOpacity
                key={token.symbol}
                style={[
                  styles.tokenOption,
                  fromToken === token.symbol && styles.tokenOptionActive,
                ]}
                onPress={() => {
                  if (toToken === token.symbol) {
                    setToToken(fromToken);
                  }
                  setFromToken(token.symbol);
                }}
              >
                <View style={[styles.tokenOptionIcon, { backgroundColor: token.color }]}>
                  <Text style={styles.tokenOptionText}>{token.symbol[0]}</Text>
                </View>
                <Text style={styles.tokenOptionName}>{token.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleSwap}
          disabled={loading || !amount}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Swapping...' : 'Swap'}
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
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tokenCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#999',
  },
  balanceText: {
    fontSize: 12,
    color: '#FFB800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 8,
    gap: 8,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  valueText: {
    fontSize: 14,
    color: '#666',
  },
  swapButton: {
    alignItems: 'center',
    marginVertical: -20,
    zIndex: 1,
  },
  swapIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFB800',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0a0a0a',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  networkText: {
    fontSize: 14,
    color: '#fff',
  },
  selectorsContainer: {
    marginTop: 20,
  },
  selectorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenOption: {
    width: '18%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  tokenOptionActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  tokenOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tokenOptionName: {
    fontSize: 11,
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#FFB800',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

