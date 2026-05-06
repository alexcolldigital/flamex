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
import { walletAPI } from '../api/client';

const tokens = [
  { symbol: 'SOL', name: 'Solana', color: '#9945FF' },
  { symbol: 'USDT', name: 'Tether USD', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
  { symbol: 'FLAME', name: 'Flame Token', color: '#FF6B00' },
];

export default function WithdrawScreen({ navigation }) {
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!address || !amount) {
      Alert.alert('Error', 'Please enter address and amount');
      return;
    }

    setLoading(true);
    try {
      await walletAPI.withdraw({
        currency: selectedToken,
        amount: parseFloat(amount),
        address,
      });
      Alert.alert('Success', 'Withdrawal initiated!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Withdrawal failed');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Token Selection */}
        <Text style={styles.sectionTitle}>Select Token</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenScroll}>
          {tokens.map((token) => (
            <TouchableOpacity
              key={token.symbol}
              style={[
                styles.tokenButton,
                selectedToken === token.symbol && styles.tokenButtonActive,
              ]}
              onPress={() => setSelectedToken(token.symbol)}
            >
              <View style={[styles.tokenIcon, { backgroundColor: token.color }]}>
                <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
              </View>
              <Text style={styles.tokenName}>{token.symbol}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Address Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${selectedToken} address`}
            placeholderTextColor="#666"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Network Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network</Text>
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Solana (SPL)</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network Fee</Text>
            <Text style={styles.infoValue}>~0.000005 SOL</Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>
            {loading ? 'Sending...' : `Send ${selectedToken}`}
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
  tokenScroll: {
    marginBottom: 24,
  },
  tokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    gap: 8,
  },
  tokenButtonActive: {
    borderWidth: 2,
    borderColor: '#FFB800',
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
  tokenName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 56,
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  sendButton: {
    backgroundColor: '#FFB800',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

