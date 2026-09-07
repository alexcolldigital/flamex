import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../store/authStore';

let Clipboard = null;
if (Platform.OS !== 'web') Clipboard = require('expo-clipboard');

const C = {
  bg: '#080B12', card: '#111722', border: '#1E293B',
  text: '#FFFFFF', muted: '#94A3B8', sub: '#475569',
  green: '#f59e2c', greenSoft: 'rgba(245,158,44,0.12)',
};

const CHAIN_COLORS = {
  solana: '#9945FF', ethereum: '#627EEA', bsc: '#F3BA2F', polygon: '#8247E5',
};

export default function WalletScreen({ navigation }) {
  const { user } = useAuthStore();
  const [showQR, setShowQR] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const wallets = user?.wallets || [];

  const copyAddress = async (address) => {
    if (Platform.OS !== 'web') {
      await Clipboard.setStringAsync(address);
    } else {
      try { await navigator.clipboard.writeText(address); } catch {}
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallets</Text>
        <TouchableOpacity style={styles.keyBtn} onPress={() => navigation.navigate('KeyManagement')}>
          <Ionicons name="key-outline" size={20} color={C.green} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Total Portfolio</Text>
          <Text style={styles.portfolioValue}>$0.00</Text>
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={14} color={C.green} />
            <Text style={styles.securityText}>Non-custodial · Keys secured</Text>
          </View>
        </View>

        {wallets.map(wallet => {
          const cc = CHAIN_COLORS[wallet.chainId] || C.green;
          const chainLabel = wallet.chainId.charAt(0).toUpperCase() + wallet.chainId.slice(1);
          const ticker = wallet.chainId === 'solana' ? 'SOL' : 'ETH';
          return (
            <View key={wallet.chainId} style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <View style={styles.chainInfo}>
                  <View style={[styles.chainBadge, { backgroundColor: `${cc}18` }]}>
                    <Text style={[styles.chainInitial, { color: cc }]}>
                      {wallet.chainId[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.chainName}>{chainLabel}</Text>
                    <Text style={styles.chainTicker}>{ticker}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.qrBtn}
                  onPress={() => { setSelectedWallet(wallet); setShowQR(true); }}
                >
                  <Ionicons name="qr-code-outline" size={20} color={C.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.addressBox}>
                <Text style={styles.addressLabel}>Address</Text>
                <View style={styles.addressRow}>
                  <Text style={styles.address} numberOfLines={1}>{wallet.address}</Text>
                  <TouchableOpacity onPress={() => copyAddress(wallet.address)}>
                    <Ionicons name="copy-outline" size={16} color={C.sub} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.walletFooter}>
                <View>
                  <Text style={styles.balLabel}>Balance</Text>
                  <Text style={styles.balValue}>0.00 {ticker}</Text>
                </View>
                <View style={styles.walletActions}>
                  <TouchableOpacity
                    style={[styles.walletActionBtn, { borderColor: cc }]}
                    onPress={() => navigation.navigate('Deposit', { chainId: wallet.chainId })}
                  >
                    <Ionicons name="arrow-down" size={14} color={cc} />
                    <Text style={[styles.walletActionText, { color: cc }]}>Receive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.walletActionBtn, { borderColor: C.border }]}
                    onPress={() => navigation.navigate('Withdraw', { chainId: wallet.chainId })}
                  >
                    <Ionicons name="arrow-up" size={14} color={C.muted} />
                    <Text style={[styles.walletActionText, { color: C.muted }]}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showQR} transparent animationType="slide" onRequestClose={() => setShowQR(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receive {selectedWallet?.chainId}</Text>
              <TouchableOpacity onPress={() => setShowQR(false)}>
                <Ionicons name="close" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>
            {selectedWallet && (
              <>
                <View style={styles.qrWrap}>
                  <QRCode value={selectedWallet.address} size={200} backgroundColor="#ffffff" color="#000000" />
                </View>
                <Text style={styles.qrAddress}>{selectedWallet.address}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={() => copyAddress(selectedWallet.address)}>
                  <Ionicons name="copy" size={18} color={C.bg} />
                  <Text style={styles.copyBtnText}>Copy Address</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  keyBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 100, flexGrow: 1 },

  portfolioCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', marginBottom: 20,
  },
  portfolioLabel: { fontSize: 13, color: C.muted, marginBottom: 8 },
  portfolioValue: { fontSize: 40, fontWeight: '800', color: C.text, marginBottom: 12 },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  securityText: { fontSize: 12, color: C.sub },

  walletCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  chainInfo: { flexDirection: 'row', alignItems: 'center' },
  chainBadge: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  chainInitial: { fontSize: 18, fontWeight: '800' },
  chainName: { fontSize: 16, fontWeight: '600', color: C.text },
  chainTicker: { fontSize: 12, color: C.muted, marginTop: 2 },
  qrBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#0D1117', borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },

  addressBox: {
    backgroundColor: '#0D1117', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  addressLabel: { fontSize: 11, color: C.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  address: { flex: 1, fontSize: 13, color: C.muted, marginRight: 8 },

  walletFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balLabel: { fontSize: 11, color: C.sub, marginBottom: 4 },
  balValue: { fontSize: 18, fontWeight: '700', color: C.text },
  walletActions: { flexDirection: 'row', gap: 8 },
  walletActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  walletActionText: { fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: C.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.border,
    alignSelf: 'center', marginBottom: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  qrWrap: {
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16,
    alignSelf: 'center', marginBottom: 20,
  },
  qrAddress: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20 },
  copyBtn: {
    backgroundColor: C.green, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 16, borderRadius: 14, gap: 8,
  },
  copyBtnText: { color: C.bg, fontWeight: '700', fontSize: 15 },
});
