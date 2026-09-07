import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
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

export default function CreateWalletScreen({ navigation, route }) {
  const isRestore = route?.params?.restore === true;
  const { register, checkUsernameAvailability } = useAuthStore();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState(1);
  const [mnemonic, setMnemonic] = useState('');
  const [selectedChains, setSelectedChains] = useState(['solana']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingUsername, setIsSuggestingUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });

  useEffect(() => {
    if (!isRestore) setMnemonic(generateMnemonic());
  }, [isRestore]);

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
    const phrase = mnemonic.trim();
    const seed = mnemonicToSeedSync(phrase);
    const solanaSeed = derivePath("m/44'/501'/0'/0'", Buffer.from(seed).toString('hex')).key;
    const solanaKeypair = Keypair.fromSeed(solanaSeed);
    const evmWallet = ethers.Wallet.fromPhrase(phrase, "m/44'/60'/0'/0/0");

    return selectedChains.map((chainId) => {
      if (chainId === 'solana') {
        return {
          chainId,
          address: solanaKeypair.publicKey.toString(),
          publicKey: solanaKeypair.publicKey.toString(),
          privateKey: bs58.encode(solanaKeypair.secretKey)
        };
      }

      return {
        chainId,
        address: evmWallet.address,
        publicKey: evmWallet.publicKey,
        privateKey: evmWallet.privateKey
      };
    });
  };

  const suggestUsername = async () => {
    const firstName = userData.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastName = userData.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const base = `${firstName}${lastName}`.slice(0, 24) || 'flameuser';
    const candidates = [base, `${base}${firstName.length + lastName.length}`, `${base}${new Date().getFullYear()}`];

    setIsSuggestingUsername(true);
    try {
      for (const candidate of [...new Set(candidates)]) {
        if (await checkUsernameAvailability(candidate)) {
          setUserData((current) => ({ ...current, username: candidate }));
          return;
        }
      }
      Alert.alert('No suggestion available', 'Please enter a username manually.');
    } finally {
      setIsSuggestingUsername(false);
    }
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, phone, username, password, confirmPassword } = userData;
    if (!firstName || !lastName || !email || !phone || !username || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Fill in all account fields to continue.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Invalid password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Enter the same password in both fields.');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      Alert.alert('Invalid username', 'Username must be 3-30 characters using only letters, numbers, and underscores.');
      return;
    }
    if (!validateMnemonic(mnemonic.trim())) {
      Alert.alert('Invalid recovery phrase', 'Enter all 12 words in the correct order.');
      return;
    }

    setIsLoading(true);
    const { confirmPassword: unusedConfirmPassword, ...registrationData } = userData;
    const result = await register({
      ...registrationData,
      mnemonic,
      wallets: generateWallets(),
      referralCode: userData.referralCode ? userData.referralCode.trim().toUpperCase() : undefined
    });
    setIsLoading(false);

    if (!result.success) {
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
          <Text style={styles.headerTitle}>{isRestore ? 'Restore Wallet' : 'Create Wallet'}</Text>
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
              <Text style={styles.stepTitle}>{isRestore ? 'Enter your recovery phrase' : 'Your recovery phrase'}</Text>
              <Text style={styles.stepDescription}>
                {isRestore
                  ? 'Enter the 12 words in order. The same phrase will recreate the wallet addresses.'
                  : 'Write these 12 words down. This phrase is the only way to recover your non-custodial wallet.'}
              </Text>

              <View style={styles.card}>
                {isRestore ? (
                  <TextInput
                    style={[styles.input, styles.recoveryInput]}
                    value={mnemonic}
                    onChangeText={(value) => setMnemonic(value.toLowerCase().replace(/\s+/g, ' '))}
                    placeholder="word1 word2 word3 ..."
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                  />
                ) : (
                  <>
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
                  </>
                )}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
                <Text style={styles.primaryButtonText}>{isRestore ? 'Continue with phrase' : 'I have saved it'}</Text>
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
                  autoCapitalize={key === 'referralCode' || key === 'username' || key === 'email' ? 'none' : 'words'}
                  secureTextEntry={false}
                />
              ))}

              {[
                ['password', 'Password', showPassword, setShowPassword],
                ['confirmPassword', 'Confirm password', showConfirmPassword, setShowConfirmPassword]
              ].map(([key, label, isVisible, setIsVisible]) => (
                <View key={key} style={styles.passwordField}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={userData[key]}
                    onChangeText={(value) => setUserData((current) => ({ ...current, [key]: value }))}
                    placeholder={label}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!isVisible}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setIsVisible((visible) => !visible)}
                    accessibilityLabel={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                  >
                    <Ionicons name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.usernameSection}>
                <View style={styles.usernameHeader}>
                  <TextInput
                    style={[styles.input, styles.usernameInput]}
                    value={userData.username}
                    onChangeText={(value) => setUserData((current) => ({
                      ...current,
                      username: value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
                    }))}
                    placeholder="Username"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                  />
                  <TouchableOpacity
                    style={styles.suggestButton}
                    onPress={suggestUsername}
                    disabled={isSuggestingUsername || isLoading}
                  >
                    {isSuggestingUsername ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.suggestButtonText}>Suggest</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.usernameHint}>Use a suggestion or choose your own unique username.</Text>
              </View>

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
    usernameSection: {
      marginTop: 12
    },
    usernameHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    usernameInput: {
      flex: 1,
      marginBottom: 0
    },
    suggestButton: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      minWidth: 78,
      alignItems: 'center'
    },
    suggestButtonText: {
      color: colors.primary,
      fontWeight: '700'
    },
    usernameHint: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 6
    },
    passwordField: {
      position: 'relative'
    },
    passwordInput: {
      paddingRight: 52
    },
    eyeButton: {
      position: 'absolute',
      right: 14,
      top: 0,
      bottom: 12,
      justifyContent: 'center'
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
    },
    recoveryInput: {
      minHeight: 110,
      textAlignVertical: 'top'
    }
  });
