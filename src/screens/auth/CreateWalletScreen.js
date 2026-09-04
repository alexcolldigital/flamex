import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import { generateMnemonic } from 'bip39';
import bs58 from 'bs58';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Keypair } from '@solana/web3.js';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const SUPPORTED_CHAINS = [
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'bsc', name: 'BSC', symbol: 'BNB', color: '#F3BA2F' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5' }
];

export default function CreateWalletScreen({ navigation }) {
  const { register } = useAuthStore();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState(1);
  const [mnemonic, setMnemonic] = useState('');
  const [selectedChains, setSelectedChains] = useState(['solana']);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    referralCode: ''
  });

  useEffect(() => {
    setMnemonic(generateMnemonic());
  }, []);

  const copyMnemonic = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('Recovery phrase copied', 'Store it somewhere safe and offline.');
  };

  const toggleChain = (chainId) => {
    setSelectedChains((current) =>
      current.includes(chainId)
        ? current.filter((item) => item !== chainId)
        : [...current, chainId]
    );
  };

  const generateWallets = () => {
    return selectedChains.map((chainId) => {
      if (chainId === 'solana') {
        const keypair = Keypair.generate();
        return {
          chainId,
          address: keypair.publicKey.toString(),
          publicKey: keypair.publicKey.toString(),
          privateKey: bs58.encode(keypair.secretKey)
        };
      }

      const wallet = ethers.Wallet.createRandom();
      return {
        chainId,
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey
      };
    });
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, password } = userData;
    if (!firstName || !lastName || !email || !phone || !password) {
      Alert.alert('Missing details', 'Fill in all account fields to continue.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      ...userData,
      mnemonic,
      wallets: generateWallets(),
      referralCode: userData.referralCode ? userData.referralCode.trim().toUpperCase() : undefined
    });
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        'Wallet created',
        'Your account is ready. Set your transaction PIN from Settings before using fiat and bill payments.'
      );
    } else {
      Alert.alert('Registration failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient colors={colors.authGradient} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Wallet</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.progress}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.dot, item === step && styles.dotActive, item < step && styles.dotCompleted]} />
          ))}
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <View>
              <Text style={styles.stepTitle}>Your recovery phrase</Text>
              <Text style={styles.stepDescription}>
                Write these 12 words down. This phrase is the only way to recover your non-custodial wallet.
              </Text>

              <View style={styles.card}>
                <View style={styles.mnemonicGrid}>
                  {mnemonic.split(' ').map((word, index) => (
                    <View key={word + index} style={styles.wordBadge}>
                      <Text style={styles.wordNumber}>{index + 1}</Text>
                      <Text style={styles.wordText}>{word}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.secondaryButton} onPress={copyMnemonic}>
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                  <Text style={styles.secondaryButtonText}>Copy phrase</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
                <Text style={styles.primaryButtonText}>I have saved it</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Text style={styles.stepTitle}>Select chains</Text>
              <Text style={styles.stepDescription}>
                Choose the networks you want ready from day one.
              </Text>

              {SUPPORTED_CHAINS.map((chain) => (
                <TouchableOpacity
                  key={chain.id}
                  style={[styles.chainItem, selectedChains.includes(chain.id) && styles.chainItemActive]}
                  onPress={() => toggleChain(chain.id)}
                >
                  <View style={[styles.chainIcon, { backgroundColor: `${chain.color}22` }]}>
                    <Text style={[styles.chainIconText, { color: chain.color }]}>{chain.symbol[0]}</Text>
                  </View>
                  <View style={styles.chainInfo}>
                    <Text style={styles.chainName}>{chain.name}</Text>
                    <Text style={styles.chainSymbol}>{chain.symbol}</Text>
                  </View>
                  {selectedChains.includes(chain.id) ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.primaryButton, selectedChains.length === 0 && styles.disabledButton]}
                onPress={() => setStep(3)}
                disabled={selectedChains.length === 0}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {step === 3 ? (
            <View>
              <Text style={styles.stepTitle}>Create account</Text>
              <Text style={styles.stepDescription}>Enter your details to finish setup.</Text>

              {[
                ['firstName', 'First name'],
                ['lastName', 'Last name'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['password', 'Password'],
                ['referralCode', 'Referral code (optional)']
              ].map(([key, label]) => (
                <TextInput
                  key={key}
                  style={styles.input}
                  value={userData[key]}
                  onChangeText={(value) => setUserData((current) => ({ ...current, [key]: value }))}
                  placeholder={label}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'}
                  autoCapitalize={key === 'referralCode' ? 'characters' : key === 'email' ? 'none' : 'words'}
                  secureTextEntry={key === 'password'}
                />
              ))}

              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <Text style={styles.primaryButtonText}>Create wallet</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    gradient: {
      flex: 1
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text
    },
    placeholder: {
      width: 24
    },
    progress: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 20
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.primary
    },
    dotCompleted: {
      backgroundColor: colors.success
    },
    content: {
      flex: 1,
      padding: 20
    },
    contentContainer: {
      paddingBottom: 40,
      flexGrow: 1
    },
    stepTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8
    },
    stepDescription: {
      color: colors.textMuted,
      marginBottom: 20,
      lineHeight: 22
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20
    },
    mnemonicGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
    },
    wordBadge: {
      width: '31%',
      backgroundColor: colors.cardAlt,
      borderRadius: 10,
      padding: 12
    },
    wordNumber: {
      color: colors.primary,
      fontSize: 11,
      marginBottom: 4
    },
    wordText: {
      color: colors.text,
      fontWeight: '600'
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 18,
      gap: 8
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: '700'
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      marginTop: 12
    },
    disabledButton: {
      opacity: 0.6
    },
    primaryButtonText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '700'
    },
    chainItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12
    },
    chainItemActive: {
      borderColor: colors.primary
    },
    chainIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center'
    },
    chainIconText: {
      fontWeight: '700',
      fontSize: 18
    },
    chainInfo: {
      flex: 1,
      marginLeft: 14
    },
    chainName: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 15
    },
    chainSymbol: {
      color: colors.textMuted,
      marginTop: 4
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 16,
      paddingVertical: 15,
      marginBottom: 12
    }
  });
