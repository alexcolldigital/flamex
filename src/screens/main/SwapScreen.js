import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, TextInput as RNTextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TOKENS = [
  { symbol: 'SOL', name: 'Solana', color: '#9945FF' },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
  { symbol: 'FLAME', name: 'Flame Token', color: '#f59e0b' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F' }
];

const SwapScreen = ({ navigation }) => {
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDT');
  const [fromAmount, setFromAmount] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleSwap = async () => {
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
      setFromAmount('');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Swap</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* From Section */}
          <View style={styles.swapSection}>
            <View style={styles.sectionLabel}>
              <Text style={styles.labelText}>From</Text>
              <Text style={styles.balanceText}>Balance: 0.00 {fromToken}</Text>
            </View>
            <View style={styles.inputContainer}>
              <RNTextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                value={fromAmount}
                onChangeText={setFromAmount}
              />
              <TouchableOpacity style={styles.tokenSelector} onPress={() => setShowTokenSelector('from')}>
                <Text style={styles.selectedToken}>{fromToken}</Text>
                <Ionicons name="chevron-down" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Swap Button */}
          <TouchableOpacity style={styles.swapButton} onPress={switchTokens}>
            <View style={styles.swapIcon}>
              <Ionicons name="swap-vertical" size={24} color="#f59e0b" />
            </View>
          </TouchableOpacity>

          {/* To Section */}
          <View style={styles.swapSection}>
            <View style={styles.sectionLabel}>
              <Text style={styles.labelText}>To (estimated)</Text>
            </View>
            <View style={styles.inputContainer}>
              <RNTextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                editable={false}
                value={fromAmount ? (parseFloat(fromAmount) * 0.98).toFixed(4) : ''}
              />
              <TouchableOpacity style={styles.tokenSelector} onPress={() => setShowTokenSelector('to')}>
                <Text style={styles.selectedToken}>{toToken}</Text>
                <Ionicons name="chevron-down" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quote Details */}
          <View style={styles.quoteContainer}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Rate</Text>
              <Text style={styles.quoteValue}>1 {fromToken} ≈ 0.98 {toToken}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Network Fee</Text>
              <Text style={styles.quoteValue}>~$0.50</Text>
            </View>
          </View>

          {/* Swap Action */}
          <TouchableOpacity style={styles.actionButton} onPress={handleSwap} disabled={isSwapping || !fromAmount}>
            <LinearGradient colors={fromAmount ? ['#f59e0b', '#d97706'] : ['#3e3e3e', '#2e2e2e']} style={styles.actionGradient}>
              {isSwapping ? <ActivityIndicator color="#0a0a0f" /> : <Text style={styles.actionText}>Swap</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Token Selector Modal */}
        {showTokenSelector && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Token</Text>
                <TouchableOpacity onPress={() => setShowTokenSelector(null)}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {TOKENS.map(token => (
                  <TouchableOpacity
                    key={token.symbol}
                    style={styles.tokenOption}
                    onPress={() => {
                      if (showTokenSelector === 'from') setFromToken(token.symbol);
                      else setToToken(token.symbol);
                      setShowTokenSelector(null);
                    }}
                  >
                    <View style={[styles.tokenLogo, { backgroundColor: `${token.color}20` }]}>
                      <Text style={[styles.tokenLogoText, { color: token.color }]}>{token.symbol[0]}</Text>
                    </View>
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                      <Text style={styles.tokenName}>{token.name}</Text>
                    </View>
                    {(showTokenSelector === 'from' ? fromToken : toToken) === token.symbol && (
                      <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  content: { flex: 1, padding: 20 },
  swapSection: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20 },
  sectionLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  labelText: { color: '#6b7280', fontSize: 14 },
  balanceText: { color: '#9ca3af', fontSize: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  amountInput: { flex: 1, color: '#ffffff', fontSize: 32, fontWeight: 'bold' },
  tokenSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  selectedToken: { color: '#f59e0b', fontWeight: '600', marginRight: 8 },
  swapButton: { alignItems: 'center', marginVertical: -20, zIndex: 10 },
  swapIcon: { width: 48, height: 48, backgroundColor: '#1a1a2e', borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f59e0b' },
  quoteContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginTop: 20 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  quoteLabel: { color: '#6b7280', fontSize: 13 },
  quoteValue: { color: '#ffffff', fontSize: 13 },
  actionButton: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  actionGradient: { paddingVertical: 18, alignItems: 'center' },
  actionText: { color: '#0a0a0f', fontSize: 16, fontWeight: '600' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  tokenOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tokenLogo: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  tokenLogoText: { fontSize: 16, fontWeight: 'bold' },
  tokenInfo: { flex: 1, marginLeft: 12 },
  tokenSymbol: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  tokenName: { color: '#6b7280', fontSize: 13, marginTop: 2 }
});

export default SwapScreen;
