import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTransferStore } from '../../store/transferStore';
import { useWalletStore } from '../../store/walletStore';

const SUPPORTED_CHAINS = [
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945ff' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
  { id: 'bsc', name: 'BSC', symbol: 'BNB', color: '#f3ba2f' },
  { id: 'base', name: 'Base', symbol: 'ETH', color: '#0052ff' },
];

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

export default function TransferScreen({ navigation }) {
  const { user, verifyPin } = useAuthStore();
  const { validateUsername, executeTransfer } = useTransferStore();
  const { wallets, balances, fetchBalance } = useWalletStore();
  
  const [recipient, setRecipient] = useState('');
  const [recipientType, setRecipientType] = useState('username'); // 'username' or 'address'
  const [selectedChain, setSelectedChain] = useState('solana');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [showChainModal, setShowChainModal] = useState(false);
  const [step, setStep] = useState(1); // 1: recipient, 2: amount, 3: confirm

  const debouncedValidate = useCallback(
    async (value) => {
      if (value.length < 3) {
        setRecipientInfo(null);
        return;
      }

      setIsValidating(true);
      try {
        const result = await validateUsername(value);
        if (result.valid) {
          setRecipientInfo(result.user);
        } else {
          setRecipientInfo(null);
        }
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    },
    [validateUsername]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipient && recipientType === 'username') {
        debouncedValidate(recipient);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [recipient, recipientType, debouncedValidate]);

  const getSelectedBalance = () => {
    const chainBalances = balances[selectedChain] || {};
    return chainBalances.native || 0;
  };

  const getTokenSymbol = () => {
    return SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.symbol || '';
  };

  const handleMaxAmount = () => {
    const balance = getSelectedBalance();
    // Leave some for gas fees
    const maxAmount = Math.max(0, balance - 0.01);
    setAmount(maxAmount.toString());
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!recipient) {
        Alert.alert('Error', 'Please enter a recipient');
        return;
      }
      if (recipientType === 'username' && !recipientInfo) {
        Alert.alert('Error', 'Invalid username');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      if (numAmount > getSelectedBalance()) {
        Alert.alert('Error', 'Insufficient balance');
        return;
      }
      setStep(3);
    }
  };

  const handleTransfer = async () => {
    setShowPinModal(true);
  };

  const confirmTransfer = async () => {
    if (pin.length !== 6) {
      Alert.alert('Error', 'Please enter your 6-digit PIN');
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        Alert.alert('Error', 'Invalid PIN');
        setPin('');
        setIsSubmitting(false);
        return;
      }

      const result = await executeTransfer({
        recipient,
        recipientType,
        chain: selectedChain,
        amount: parseFloat(amount),
        note,
        pin,
      });

      if (result.success) {
        Alert.alert(
          'Success',
          `Successfully sent ${amount} ${getTokenSymbol()} to @${recipient}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        fetchBalance();
      } else {
        Alert.alert('Error', result.message || 'Transfer failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete transfer');
    } finally {
      setIsSubmitting(false);
      setShowPinModal(false);
      setPin('');
    }
  };

  const renderRecipientStep = () => (
    <View style={styles.stepContent}>
      {/* Recipient Type Toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            recipientType === 'username' && styles.typeBtnActive,
          ]}
          onPress={() => {
            setRecipientType('username');
            setRecipient('');
            setRecipientInfo(null);
          }}
        >
          <Text
            style={[
              styles.typeBtnText,
              recipientType === 'username' && styles.typeBtnTextActive,
            ]}
          >
            Username
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            recipientType === 'address' && styles.typeBtnActive,
          ]}
          onPress={() => {
            setRecipientType('address');
            setRecipient('');;
            setRecipientInfo(null);
          }}
        >
          <Text
            style={[
              styles.typeBtnText,
              recipientType === 'address' && styles.typeBtnTextActive,
            ]}
          >
            Wallet Address
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recipient Input */}
      <Text style={styles.sectionLabel}>
        {recipientType === 'username' ? 'Enter Username' : 'Enter Wallet Address'}
      </Text>
      <View style={styles.recipientInputContainer}>
        {recipientType === 'username' && <Text style={styles.atSymbol}>@</Text>}
        <TextInput
          style={styles.recipientInput}
          value={recipient}
          onChangeText={setRecipient}
          placeholder={
            recipientType === 'username' ? 'username' : '0x... or address'
          }
          placeholderTextColor="#444"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isValidating && (
          <ActivityIndicator size="small" color="#f59e0b" />
        )}
        {!isValidating && recipientInfo && (
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
        )}
      </View>

      {/* Recipient Info */}
      {recipientInfo && (
        <View style={styles.recipientCard}>
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientAvatarText}>
              {recipientInfo.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.recipientName}>@{recipientInfo.username}</Text>
            <Text style={styles.recipientStatus}>Verified User</Text>
          </View>
        </View>
      )}

      {/* Chain Selection */}
      <Text style={styles.sectionLabel}>Select Chain</Text>
      <TouchableOpacity
        style={styles.chainSelectBtn}
        onPress={() => setShowChainModal(true)}
      >
        <View style={styles.selectedChain}>
          <View
            style={[
              styles.chainIcon,
              {
                backgroundColor: `${
                  SUPPORTED_CHAINS.find((c) => c.id === selectedChain)?.color
                }20`,
              },
            ]}
          >
            <Text
              style={[
                styles.chainSymbol,
                {
                  color: SUPPORTED_CHAINS.find((c) => c.id === selectedChain)?.color,
                },
              ]}
            >
              {SUPPORTED_CHAINS.find((c) => c.id === selectedChain)?.symbol.charAt(0)}
            </Text>
          </View>
          <Text style={styles.selectedChainName}>
            {SUPPORTED_CHAINS.find((c) => c.id === selectedChain)?.name}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.continueBtn,
          !recipient && styles.continueBtnDisabled,
        ]}
        onPress={handleContinue}
        disabled={!recipient}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAmountStep = () => (
    <View style={styles.stepContent}>
      {/* Recipient Summary */}
      <View style={styles.recipientSummary}>
        <Text style={styles.summaryLabel}>Sending to</Text>
        <View style={styles.summaryValue}>
          <Text style={styles.summaryName}>
            {recipientType === 'username' ? `@${recipient}` : recipient}
          </Text>
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Amount Input */}
      <Text style={styles.sectionLabel}>Enter Amount</Text>
      <View style={styles.amountInputContainer}>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#444"
        />
        <View style={styles.amountToken}>
          <Text style={styles.amountTokenText}>{getTokenSymbol()}</Text>
        </View>
        <TouchableOpacity style={styles.maxBtn} onPress={handleMaxAmount}>
          <Text style={styles.maxBtnText}>MAX</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.balanceText}>
        Available: {getSelectedBalance().toFixed(4)} {getTokenSymbol()}
      </Text>

      {/* Quick Amounts */}
      <Text style={styles.sectionLabel}>Quick Select</Text>
      <View style={styles.quickAmounts}>
        {QUICK_AMOUNTS.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.quickAmountBtn,
              amount === value.toString() && styles.quickAmountBtnActive,
            ]}
            onPress={() => setAmount(value.toString())}
          >
            <Text
              style={[
                styles.quickAmountText,
                amount === value.toString() && styles.quickAmountTextActive,
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Note Input */}
      <Text style={styles.sectionLabel}>Note (Optional)</Text>
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder="Add a note..."
        placeholderTextColor="#444"
        multiline
        maxLength={100}
      />

      <TouchableOpacity
        style={[
          styles.continueBtn,
          (!amount || parseFloat(amount) <= 0) && styles.continueBtnDisabled,
        ]}
        onPress={handleContinue}
        disabled={!amount || parseFloat(amount) <= 0}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.confirmCard}>
        <Text style={styles.confirmTitle}>Confirm Transfer</Text>

        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Recipient</Text>
          <Text style={styles.confirmValue}>
            {recipientType === 'username' ? `@${recipient}` : recipient}
          </Text>
        </View>

        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Chain</Text>
          <Text style={styles.confirmValue}>
            {SUPPORTED_CHAINS.find((c) => c.id === selectedChain)?.name}
          </Text>
        </View>

        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Amount</Text>
          <Text style={styles.confirmValue}>
            {amount} {getTokenSymbol()}
          </Text>
        </View>

        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Network Fee</Text>
          <Text style={styles.confirmValue}>~0.001 {getTokenSymbol()}</Text>
        </View>

        {note && (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Note</Text>
            <Text style={styles.confirmValue}>{note}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabelTotal}>Total</Text>
          <Text style={styles.confirmValueTotal}>
            {(parseFloat(amount) + 0.001).toFixed(4)} {getTokenSymbol()}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.transferBtn} onPress={handleTransfer}>
        <Text style={styles.transferBtnText}>Confirm Transfer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                <Text
                  style={[styles.stepNumber, step >= s && styles.stepNumberActive]}
                >
                  {s}
                </Text>
              </View>
              {s < 3 && (
                <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {step === 1 && renderRecipientStep()}
        {step === 2 && renderAmountStep()}
        {step === 3 && renderConfirmationStep()}
      </ScrollView>

      {/* Chain Selection Modal */}
      <Modal
        visible={showChainModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChainModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Chain</Text>
              <TouchableOpacity onPress={() => setShowChainModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SUPPORTED_CHAINS.map((chain) => (
                <TouchableOpacity
                  key={chain.id}
                  style={styles.chainItem}
                  onPress={() => {
                    setSelectedChain(chain.id);
                    setShowChainModal(false);
                  }}
                >
                  <View style={styles.chainItemLeft}>
                    <View
                      style={[
                        styles.chainItemIcon,
                        { backgroundColor: `${chain.color}20` },
                      ]}
                    >
                      <Text style={[styles.chainItemSymbol, { color: chain.color }]}>
                        {chain.symbol.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.chainItemName}>{chain.name}</Text>
                      <Text style={styles.chainItemSymbolText}>{chain.symbol}</Text>
                    </View>
                  </View>
                  {selectedChain === chain.id && (
                    <Ionicons name="checkmark" size={20} color="#f59e0b" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.pinModalOverlay}>
          <View style={styles.pinModalContent}>
            <Ionicons name="lock-closed" size={48} color="#f59e0b" />
            <Text style={styles.pinModalTitle}>Enter PIN</Text>
            <Text style={styles.pinModalSubtitle}>Confirm transfer</Text>

            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              placeholder="------"
              placeholderTextColor="#444"
              textAlign="center"
              autoFocus
            />

            <TouchableOpacity
              style={styles.pinConfirmBtn}
              onPress={confirmTransfer}
              disabled={pin.length !== 6 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#0a0a0f" />
              ) : (
                <Text style={styles.pinConfirmBtnText}>Confirm</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pinCancelBtn}
              onPress={() => {
                setShowPinModal(false);
                setPin('');
              }}
            >
              <Text style={styles.pinCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#f59e0b',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  stepNumberActive: {
    color: '#0a0a0f',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#f59e0b',
  },
  stepContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: '#f59e0b',
  },
  typeBtnText: {
    fontSize: 14,
    color: '#888',
  },
  typeBtnTextActive: {
    color: '#0a0a0f',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 12,
  },
  recipientInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  atSymbol: {
    fontSize: 18,
    color: '#666',
    marginRight: 8,
  },
  recipientInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e20',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0f',
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
  },
  recipientStatus: {
    fontSize: 12,
    color: '#22c55e80',
    marginTop: 2,
  },
  chainSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  selectedChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chainIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chainSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedChainName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  continueBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#333',
  },
  continueBtnText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '600',
  },
  recipientSummary: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  summaryValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  changeText: {
    fontSize: 13,
    color: '#f59e0b',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
  },
  amountToken: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  amountTokenText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  maxBtn: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxBtnText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountBtn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickAmountBtnActive: {
    backgroundColor: '#f59e0b20',
    borderColor: '#f59e0b',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#888',
  },
  quickAmountTextActive: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  noteInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  backBtnText: {
    color: '#888',
    fontSize: 14,
  },
  confirmCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  confirmLabel: {
    fontSize: 13,
    color: '#888',
  },
  confirmValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  confirmLabelTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  confirmValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  transferBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  transferBtnText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  chainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  chainItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chainItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chainItemSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chainItemName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  chainItemSymbolText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pinModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  pinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  pinModalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  pinInput: {
    width: 200,
    height: 56,
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    fontSize: 24,
    color: '#fff',
    letterSpacing: 8,
    marginTop: 24,
  },
  pinConfirmBtn: {
    width: 200,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  pinConfirmBtnText: {
    color: '#0a0a0f',
    fontSize: 16,
    fontWeight: '600',
  },
  pinCancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  pinCancelBtnText: {
    color: '#888',
    fontSize: 14,
  },
});
