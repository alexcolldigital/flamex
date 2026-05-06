import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const features = [
  {
    icon: 'shield-check',
    title: 'Non-Custodial',
    description: 'You control your private keys and seed phrase',
  },
  {
    icon: 'lightning-bolt',
    title: 'Instant Transactions',
    description: 'Send and receive crypto in seconds on Solana',
  },
  {
    icon: 'coins',
    title: 'Multi-Token Support',
    description: 'SOL, USDT, USDC, and FLAME tokens',
  },
  {
    icon: 'key',
    title: 'Secure Recovery',
    description: '12-word seed phrase for wallet recovery',
  },
];

const stats = [
  { value: '₦50B+', label: 'Volume Traded' },
  { value: '100K+', label: 'Active Wallets' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9', label: 'App Rating' },
];

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="fire" size={32} color="#FFB800" />
            <Text style={styles.logoText}>
              <Text style={styles.logoHighlight}>Flame</Text>X
            </Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Your Keys,{'\n'}
            <Text style={styles.heroHighlight}>Your Crypto</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Non-custodial wallet for SOL, USDT, and FLAME tokens. Full control with seed phrase recovery.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose FlameX?</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Icon name={feature.icon} size={24} color="#FFB800" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryButtonText}>Create Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I already have a wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © 2024 FlameX. All rights reserved. Non-custodial wallet.
        </Text>
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
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoHighlight: {
    color: '#FFB800',
  },
  hero: {
    padding: 20,
    paddingTop: 40,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 48,
  },
  heroHighlight: {
    color: '#FFB800',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  ctaSection: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFB800',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  footer: {
    textAlign: 'center',
    padding: 20,
    fontSize: 12,
    color: '#666',
  },
});

