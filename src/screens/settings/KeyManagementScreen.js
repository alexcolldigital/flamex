import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useWalletStore } from '../../store/walletStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function KeyManagementScreen({ navigation }) {
  const { summary, exportKeys } = useWalletStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState(null);

  const handleExport = async () => {
    if (!password) {
      Alert.alert('Password required', 'Enter your account password to export keys.');
      return;
    }

    setLoading(true);
    const result = await exportKeys(password);
    setLoading(false);

    if (result.success) {
      setRevealedKeys(result);
    } else {
      Alert.alert('Export failed', result.error);
    }
  };

  const copyValue = async (value, label) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Key Management</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={24} color={colors.primary} />
          <Text style={styles.warningTitle}>Keep these details offline</Text>
          <Text style={styles.warningText}>
            Your recovery phrase and private keys grant full access to your non-custodial wallet. Never share them.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verify your password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter account password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleExport} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.primaryButtonText}>Reveal recovery phrase</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Wallets on this account</Text>
          {(summary?.wallets || []).map((wallet) => (
            <View key={wallet.chainId} style={styles.walletRow}>
              <View>
                <Text style={styles.walletName}>{wallet.chain?.name || wallet.chainId}</Text>
                <Text style={styles.walletAddress}>{wallet.address}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={Boolean(revealedKeys)} transparent animationType="slide" onRequestClose={() => setRevealedKeys(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sensitive Wallet Material</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalLabel}>Recovery phrase</Text>
              <TouchableOpacity style={styles.secretCard} onPress={() => copyValue(revealedKeys?.mnemonic || '', 'Recovery phrase')}>
                <Text style={styles.secretText}>{revealedKeys?.mnemonic || 'Unavailable'}</Text>
              </TouchableOpacity>

              {(revealedKeys?.wallets || []).map((wallet) => (
                <View key={wallet.chainId} style={styles.secretGroup}>
                  <Text style={styles.modalLabel}>{wallet.chainId}</Text>
                  <TouchableOpacity
                    style={styles.secretCard}
                    onPress={() => copyValue(wallet.privateKey, `${wallet.chainId} private key`)}
                  >
                    <Text style={styles.secretText}>{wallet.privateKey}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setRevealedKeys(null)}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: 16,
      paddingBottom: 16
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text
    },
    placeholder: {
      width: 40
    },
    scrollView: {
      flex: 1
    },
    content: {
      padding: 16,
      gap: 16
    },
    warningCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: 16,
      padding: 16
    },
    warningTitle: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 10
    },
    warningText: {
      color: colors.text,
      marginTop: 8,
      lineHeight: 20
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 14
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 15,
      marginTop: 14
    },
    primaryButtonText: {
      color: colors.black,
      fontWeight: '700'
    },
    walletRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    walletName: {
      color: colors.text,
      fontWeight: '700'
    },
    walletAddress: {
      color: colors.textMuted,
      marginTop: 4
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end'
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%'
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12
    },
    modalScroll: {
      maxHeight: 420
    },
    modalLabel: {
      color: colors.textMuted,
      marginTop: 12,
      marginBottom: 6
    },
    secretGroup: {
      marginTop: 8
    },
    secretCard: {
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 14
    },
    secretText: {
      color: colors.text,
      lineHeight: 22
    }
  });
