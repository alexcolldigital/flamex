import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import QRCode from './components/QRCodeWrapper';
import { walletAPI } from '../api/client';

const tokens = [
  { symbol: 'SOL', name: 'Solana', color: '#9945FF' },
  { symbol: 'USDT', name: 'Tether USD', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
  { symbol: 'FLAME', name: 'Flame Token', color: '#FF6B00' },
];

export default function DepositScreen({ navigation }) {
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [wallet, setWallet] = useState(null);

  const handleDeposit = async () => {
    // Mock deposit for demo
    try {
      await walletAPI.deposit({
        currency: selectedToken,
        amount: selectedToken === 'SOL' ? 1 : selectedToken === 'FLAME' ? 1000 : 100,
        txHash: 'mock-tx-hash-' + Date.now(),
      });
      Alert.alert('Success', `${selectedToken} deposited successfully!`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Deposit failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Token Selection */}
        <Text style={styles.sectionTitle}>Select Token</Text>
        <View style={styles.tokenGrid}>
          {tokens.map((token) => (
            <TouchableOpacity
              key={token.symbol}
              style={[
                styles.tokenCard,
                selectedToken === token.symbol && styles.tokenCardActive,
              ]}
              onPress={() => setSelectedToken(token.symbol)}
            >
              <View style={[styles.tokenIcon, { backgroundColor: token.color }]}>
                <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
              </View>
              <Text style={styles.tokenName}>{token.name}</Text>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* QR Code */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Your Deposit Address</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={`solana:deposit-${selectedToken}`}
              size={180}
              backgroundColor="#fff"
              color="#0a0a0a"
            />
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>Address</Text>
            <Text style={styles.address}>
              7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
            </Text>
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Icon name="alert-circle" size={20} color="#FFB800" />
          <Text style={styles.warningText}>
            Only send {selectedToken} to this address. Sending other tokens may result in permanent loss.
          </Text>
        </View>

        {/* Demo Deposit Button */}
        <TouchableOpacity style={styles.depositButton} onPress={handleDeposit}>
          <Text style={styles.depositButtonText}>
            Demo Deposit {selectedToken === 'SOL' ? '1 SOL' : selectedToken === 'FLAME' ? '1000 FLAME' : '100 USDT'}
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
    marginBottom: 16,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  tokenCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  tokenCardActive: {
    borderWidth: 2,
    borderColor: '#FFB800',
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tokenName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  tokenSymbol: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  addressBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  addressLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FFB800',
    lineHeight: 20,
  },
  depositButton: {
    backgroundColor: '#FFB800',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

