import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0a0f', '#1a1a2e', '#0a0a0f']} style={styles.gradient}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.logo}>
              <Ionicons name="flame" size={60} color="#0a0a0f" />
            </LinearGradient>
            <Text style={styles.title}>FlameX</Text>
            <Text style={styles.subtitle}>Multi-Chain Crypto Wallet</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem icon="swap-horizontal" title="Cross-Chain Swaps" description="Swap tokens across multiple blockchains" />
            <FeatureItem icon="people" title="Refer & Earn" description="Invite friends and earn rewards" />
            <FeatureItem icon="shield-checkmark" title="Non-Custodial" description="You control your keys" />
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('CreateWallet')}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.buttonGradient}>
                <Text style={styles.primaryButtonText}>Create New Wallet</Text>
                <Ionicons name="arrow-forward" size={20} color="#0a0a0f" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.secondaryButtonText}>I Already Have a Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color="#f59e0b" />
    </View>
    <View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  gradient: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  logoSection: { alignItems: 'center', marginTop: 40 },
  logo: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#9ca3af' },
  features: { marginVertical: 20 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12 },
  featureIcon: { width: 48, height: 48, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  featureDescription: { fontSize: 13, color: '#9ca3af' },
  buttons: { marginBottom: 20 },
  primaryButton: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#0a0a0f', marginRight: 8 },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' }
});

export default WelcomeScreen;
