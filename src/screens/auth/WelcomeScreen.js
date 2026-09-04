import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#080B12', card: '#111722', border: '#1E293B',
  text: '#FFFFFF', muted: '#94A3B8', sub: '#475569',
  green: '#22C55E', greenSoft: 'rgba(34,197,94,0.12)',
};

const FEATURES = [
  { icon: 'swap-horizontal', title: 'Cross-Chain Swaps',  desc: 'Swap tokens across multiple blockchains' },
  { icon: 'people',          title: 'Refer & Earn',       desc: 'Invite friends and earn rewards' },
  { icon: 'shield-checkmark', title: 'Non-Custodial',     desc: 'You control your keys, always' },
];

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="flame" size={44} color={C.green} />
            </View>
          </View>
          <Text style={styles.title}>FlameX</Text>
          <Text style={styles.subtitle}>Your Premium Crypto Wallet</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map(f => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={C.green} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('CreateWallet')}>
            <Text style={styles.primaryBtnText}>Create New Wallet</Text>
            <Ionicons name="arrow-forward" size={18} color={C.bg} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryBtnText}>I Already Have a Wallet</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityRow}>
          <Ionicons name="lock-closed" size={12} color={C.sub} />
          <Text style={styles.securityText}>256-bit encrypted · SOC 2 compliant</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingTop: 40, paddingBottom: 32 },

  logoSection: { alignItems: 'center' },
  logoRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5, borderColor: C.green,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  logoInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.greenSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 34, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, color: C.muted },

  features: { gap: 12 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.greenSoft,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  featureDesc: { fontSize: 13, color: C.muted },

  buttons: { gap: 12 },
  primaryBtn: {
    backgroundColor: C.green, borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: C.bg },
  secondaryBtn: {
    backgroundColor: C.card, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: C.text },

  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  securityText: { fontSize: 12, color: C.sub },
});
