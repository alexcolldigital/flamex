import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { walletAPI } from '../api/client';

let Clipboard = null;
if (Platform.OS !== 'web') {
  Clipboard = require('expo-clipboard');
}

export default function KeysScreen({ navigation }) {
  const [keys, setKeys] = useState(null);
  const [showSeed, setShowSeed] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const response = await walletAPI.getKeys();
      setKeys(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    if (Platform.OS !== 'web') {
      await Clipboard.setStringAsync(text);
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.log('Copy to clipboard failed:', error);
      }
    }
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const seedWords = keys?.mnemonic?.split(' ') || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Private Keys</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning */}
        <View style={styles.warningCard}>
          <Icon name="alert" size={24} color="#FFB800" />
          <Text style={styles.warningText}>
            Never share your seed phrase or private key with anyone. Anyone with these can access your funds.
          </Text>
        </View>

        {/* Seed Phrase */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="shield-key" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Seed Phrase</Text>
          </View>
          <Text style={styles.sectionDesc}>
            12 words to recover your wallet. Write them down in order.
          </Text>

          <View style={styles.seedContainer}>
            {showSeed ? (
              <View style={styles.seedGrid}>
                {seedWords.map((word, index) => (
                  <View key={index} style={styles.seedWord}>
                    <Text style={styles.seedNumber}>{index + 1}.</Text>
                    <Text style={styles.seedText}>{word}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.seedHidden}>
                <Icon name="lock" size={32} color="#666" />
                <Text style={styles.seedHiddenText}>Tap reveal to show seed phrase</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSeed(!showSeed)}
            >
              <Icon name={showSeed ? 'eye-off' : 'eye'} size={18} color="#fff" />
              <Text style={styles.actionButtonText}>
                {showSeed ? 'Hide' : 'Reveal'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={() => copyToClipboard(keys?.mnemonic, 'Seed phrase')}
            >
              <Icon name="content-copy" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Private Key */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="key" size={20} color="#f44336" />
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Private Key</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Your wallet's master key. Never share this with anyone.
          </Text>

          <View style={[styles.keyContainer, styles.dangerBorder]}>
            {showPrivateKey ? (
              <Text style={styles.keyText} selectable>
                {keys?.privateKey}
              </Text>
            ) : (
              <View style={styles.keyHidden}>
                <Text style={styles.keyHiddenText}>
                  ••••••••••••••••••••••••••••••••••••••••••••••••••
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowPrivateKey(!showPrivateKey)}
            >
              <Icon name={showPrivateKey ? 'eye-off' : 'eye'} size={18} color="#fff" />
              <Text style={styles.actionButtonText}>
                {showPrivateKey ? 'Hide' : 'Reveal'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => copyToClipboard(keys?.privateKey, 'Private key')}
            >
              <Icon name="content-copy" size={18} color="#f44336" />
              <Text style={[styles.actionButtonText, styles.dangerText]}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="wallet" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Wallet Address</Text>
          </View>

          <View style={styles.addressContainer}>
            <Text style={styles.addressText} selectable>
              {keys?.walletAddress}
            </Text>
            <TouchableOpacity
              style={styles.addressCopy}
              onPress={() => copyToClipboard(keys?.walletAddress, 'Address')}
            >
              <Icon name="content-copy" size={18} color="#FFB800" />
            </TouchableOpacity>
          </View>
        </View>
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FFB800',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  dangerTitle: {
    color: '#f44336',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  seedContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seedWord: {
    width: '30%',
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  seedNumber: {
    fontSize: 12,
    color: '#666',
  },
  seedText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  seedHidden: {
    alignItems: 'center',
    padding: 40,
  },
  seedHiddenText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dangerText: {
    color: '#f44336',
  },
  keyContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dangerBorder: {
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  keyText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
    lineHeight: 22,
  },
  keyHidden: {
    alignItems: 'center',
    padding: 20,
  },
  keyHiddenText: {
    fontSize: 16,
    color: '#666',
    letterSpacing: 2,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  addressCopy: {
    padding: 8,
  },
});

