import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { transactionAPI } from '../api/client';

const billTypes = [
  { id: 'electricity', name: 'Electricity', icon: 'flash', color: '#FFEB3B' },
  { id: 'airtime', name: 'Airtime', icon: 'cellphone', color: '#2196F3' },
  { id: 'data', name: 'Data', icon: 'wifi', color: '#4CAF50' },
  { id: 'cable', name: 'Cable TV', icon: 'television', color: '#9C27B0' },
];

const providers = {
  electricity: ['IKEDC', 'EKEDC', 'AEDC', 'PHEDC', 'KEDCO'],
  airtime: ['MTN', 'Airtel', 'Glo', '9mobile'],
  data: ['MTN', 'Airtel', 'Glo', '9mobile'],
  cable: ['DSTV', 'GOTV', 'Startimes'],
};

export default function BillsScreen({ navigation }) {
  const [activeType, setActiveType] = useState('electricity');
  const [provider, setProvider] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!provider || !customerId || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await transactionAPI.payBill({
        type: activeType,
        provider,
        customerId,
        amount: parseFloat(amount),
        currency: 'NGN',
      });
      Alert.alert('Success', 'Bill payment successful!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Payment failed');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Bills</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bill Types */}
        <View style={styles.typesContainer}>
          {billTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                activeType === type.id && styles.typeButtonActive,
              ]}
              onPress={() => {
                setActiveType(type.id);
                setProvider('');
              }}
            >
              <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                <Icon name={type.icon} size={20} color="#0a0a0a" />
              </View>
              <Text style={styles.typeName}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Provider Selection */}
        <Text style={styles.sectionTitle}>Select Provider</Text>
        <View style={styles.providersContainer}>
          {providers[activeType].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.providerButton,
                provider === p && styles.providerButtonActive,
              ]}
              onPress={() => setProvider(p)}
            >
              <Text style={[
                styles.providerText,
                provider === p && styles.providerTextActive,
              ]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {activeType === 'electricity' ? 'Meter Number' : 
               activeType === 'cable' ? 'Smart Card Number' : 'Phone Number'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number"
              placeholderTextColor="#666"
              value={customerId}
              onChangeText={setCustomerId}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {[500, 1000, 2000, 5000].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickAmountButton}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={styles.quickAmountText}>₦{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>
            {loading ? 'Processing...' : 'Pay Bill'}
          </Text>
        </TouchableOpacity>
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
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    width: '23%',
    alignItems: 'center',
  },
  typeButtonActive: {
    opacity: 1,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  providersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  providerButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  providerButtonActive: {
    backgroundColor: '#FFB800',
  },
  providerText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  providerTextActive: {
    color: '#0a0a0a',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#FFB800',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
});

