import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../store/authStore';

let Clipboard = null;
if (Platform.OS !== 'web') {
  Clipboard = require('expo-clipboard');
}

const CHAIN_COLORS = {
  solana: '#9945FF',
  ethereum: '#627EEA',
  bsc: '#F3BA2F',
  polygon: '#8247E5'
};

const WalletScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const wallets = user?.wallets || [];

  const copyAddress = async (address) => {
    if (Platform.OS !== 'web') {
      await Clipboard.setStringAsync(address);
    } else {
      try {
        await navigator.clipboard.writeText(address);
      } catch (error) {
        console.log('Copy to clipboard failed:', error);
      }
    }
  };

  const openQRModal = (wallet) => {
    setSelectedWallet(wallet);
    setShowQRModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wallets</Text>
          <TouchableOpacity onPress={() => navigation.navigate('KeyManagement')}>
            <Ionicons name="key-outline" size={24} color="#f59e0b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.totalBalance}>
            <Text style={styles.totalLabel}>Total Portfolio</Text>
            <Text style={styles.totalValue}>$0.00</Text>
          </View>

          {wallets.map(wallet => {
            const chainColor = CHAIN_COLORS[wallet.chainId] || '#f59e0b';
            return (
              <LinearGradient key={wallet.chainId} colors={[`${chainColor}20`, `${chainColor}10`]} style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <View style={styles.chainInfo}>
                    <View style={[styles.chainBadge, { backgroundColor: chainColor }]}>
                      <Text style={styles.chainSymbol}>{wallet.chainId[0].toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.chainName}>{wallet.chainId.charAt(0).toUpperCase() + wallet.chainId.slice(1)}</Text>
                      <Text style={styles.chainSymbolText}>{wallet.chainId === 'solana' ? 'SOL' : 'ETH'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => openQRModal(wallet)}>
                    <Ionicons name="qr-code" size={24} color={chainColor} />
                  </TouchableOpacity>
                </View>

                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Address</Text>
                  <View style={styles.addressRow}>
                    <Text style={styles.address} numberOfLines={1}>{wallet.address}</Text>
                    <TouchableOpacity onPress={() => copyAddress(wallet.address)}>
                      <Ionicons name="copy-outline" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.balanceRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Balance</Text>
                    <Text style={styles.balanceValue}>0.00 {wallet.chainId === 'solana' ? 'SOL' : 'ETH'}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${chainColor}30` }]} onPress={() => navigation.navigate('Deposit', { chainId: wallet.chainId })}>
                      <Ionicons name="arrow-down" size={16} color={chainColor} />
                      <Text style={[styles.actionText, { color: chainColor }]}>Receive</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${chainColor}30` }]} onPress={() => navigation.navigate('Withdraw', { chainId: wallet.chainId })}>
                      <Ionicons name="arrow-up" size={16} color={chainColor} />
                      <Text style={[styles.actionText, { color: chainColor }]}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            );
          })}
        </ScrollView>

        <Modal visible={showQRModal} transparent animationType="slide" onRequestClose={() => setShowQRModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Receive {selectedWallet?.chainId}</Text>
                <TouchableOpacity onPress={() => setShowQRModal(false)}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              {selectedWallet && (
                <>
                  <View style={styles.qrContainer}>
                    <QRCode value={selectedWallet.address} size={200} backgroundColor="#ffffff" color="#000000" />
                  </View>
                  <Text style={styles.qrAddress}>{selectedWallet.address}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => copyAddress(selectedWallet.address)}>
                    <Ionicons name="copy" size={18} color="#0a0a0f" />
                    <Text style={styles.copyBtnText}>Copy Address</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
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
  totalBalance: { alignItems: 'center', marginBottom: 24 },
  totalLabel: { color: '#9ca3af', fontSize: 14, marginBottom: 8 },
  totalValue: { color: '#ffffff', fontSize: 40, fontWeight: 'bold' },
  walletCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chainInfo: { flexDirection: 'row', alignItems: 'center' },
  chainBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chainSymbol: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  chainName: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  chainSymbolText: { color: '#9ca3af', fontSize: 13 },
  addressContainer: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: 16 },
  addressLabel: { color: '#6b7280', fontSize: 11, marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  address: { color: '#ffffff', fontSize: 13, flex: 1, marginRight: 8 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: '#6b7280', fontSize: 11 },
  balanceValue: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  qrContainer: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, alignSelf: 'center', marginBottom: 20 },
  qrAddress: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  copyBtn: { backgroundColor: '#f59e0b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
  copyBtnText: { color: '#0a0a0f', fontWeight: '600', marginLeft: 8 }
});

export default WalletScreen;
