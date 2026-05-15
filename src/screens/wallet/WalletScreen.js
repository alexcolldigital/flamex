import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { depositAPI, priceAPI, walletAPI } from '../../api/client';
import {
  buildPriceRows,
  currencyFormatter,
  normalizeTransaction,
  tokenFormatter
} from '../../lib/finance';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function WalletScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('assets');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChain, setSelectedChain] = useState('solana');
  const [depositAddress, setDepositAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: ''
  });
  const [savingBank, setSavingBank] = useState(false);

  const loadData = async () => {
    try {
      const [walletRes, pricesRes, transactionsRes] = await Promise.all([
        walletAPI.getWallet(),
        priceAPI.getPrices(),
        walletAPI.getTransactions({ limit: 8 })
      ]);
      setWallet(walletRes.data);
      setPrices(pricesRes.data);
      setTransactions((transactionsRes.data.transactions || []).map(normalizeTransaction));
    } catch (error) {
      console.log('Load wallet error:', error);
    }
  };

  const loadDepositAddress = async (chainId) => {
    setLoadingAddress(true);
    try {
      const response = await depositAPI.getAddress(chainId);
      setDepositAddress(response.data);
    } catch (error) {
      setDepositAddress(null);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'receive') {
      loadDepositAddress(selectedChain);
    }
  }, [activeTab, selectedChain]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (activeTab === 'receive') {
      await loadDepositAddress(selectedChain);
    }
    setRefreshing(false);
  };

  const copyValue = async (value, label) => {
    await Clipboard.setStringAsync(String(value || ''));
  };

  const totalCryptoValue =
    Number(wallet?.balances?.SOL || 0) * Number(prices.SOL?.ngn || 0) +
    Number(wallet?.balances?.USDT || 0) * Number(prices.USDT?.ngn || 0) +
    Number(wallet?.balances?.USDC || 0) * Number(prices.USDC?.ngn || 0) +
    Number(wallet?.balances?.FLAME || 0) * Number(prices.FLAME?.ngn || 0) +
    Number(wallet?.balances?.ETH || 0) * Number(prices.ETH?.ngn || 0) +
    Number(wallet?.balances?.BNB || 0) * Number(prices.BNB?.ngn || 0);

  const priceRows = buildPriceRows(prices).slice(0, 4);

  const saveBankAccount = async () => {
    if (!bankForm.bankName || !bankForm.bankCode || !bankForm.accountNumber || !bankForm.accountName) {
      return;
    }

    setSavingBank(true);
    try {
      const response = await walletAPI.addBankAccount(bankForm);
      setWallet((current) => ({
        ...current,
        bankAccounts: response.data.bankAccounts || []
      }));
      setBankForm({ bankName: '', bankCode: '', accountNumber: '', accountName: '' });
    } catch (error) {
      console.log('Save bank error:', error);
    } finally {
      setSavingBank(false);
    }
  };

  const removeBankAccount = async (id) => {
    try {
      const response = await walletAPI.removeBankAccount(id);
      setWallet((current) => ({
        ...current,
        bankAccounts: response.data.bankAccounts || []
      }));
    } catch (error) {
      console.log('Remove bank error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        {['assets', 'receive', 'keys'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'assets' ? (
          <View style={styles.content}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Crypto Value</Text>
              <Text style={styles.totalValue}>{currencyFormatter(totalCryptoValue)}</Text>
              <Text style={styles.totalSubtext}>
                {currencyFormatter(wallet?.balances?.NGN || 0)} • {currencyFormatter(wallet?.balances?.USD || 0, 'USD')}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Deposit')}>
                <Icon name="bank-transfer-in" size={18} color={colors.black} />
                <Text style={styles.primaryActionText}>Fiat & crypto deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Card')}>
                <Icon name="credit-card-outline" size={18} color={colors.primary} />
                <Text style={styles.secondaryActionText}>Virtual card</Text>
              </TouchableOpacity>
            </View>

            {(wallet?.wallets || []).map((asset) => (
              <View key={asset.chainId} style={styles.assetCard}>
                <View style={[styles.assetIcon, { backgroundColor: asset.chain.color }]}>
                  <Text style={styles.assetIconText}>{asset.chain.symbol[0]}</Text>
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{asset.chain.name}</Text>
                  <Text style={styles.assetBalance}>
                    {tokenFormatter(wallet?.balances?.[asset.chain.symbol] || 0, asset.chain.symbol)}
                  </Text>
                  <Text style={styles.assetMeta}>{asset.address}</Text>
                </View>
                <View style={styles.assetActions}>
                  <TouchableOpacity style={styles.assetAction} onPress={() => navigation.navigate('Deposit', { chainId: asset.chainId })}>
                    <Text style={styles.assetActionText}>Receive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.assetAction} onPress={() => navigation.navigate('Transfer')}>
                    <Text style={styles.assetActionText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Price Snapshot</Text>
              {priceRows.map((row) => (
                <View key={row.symbol} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.symbol}</Text>
                  <Text style={styles.infoValue}>
                    {currencyFormatter(row.ngn)} ({row.change24h >= 0 ? '+' : ''}
                    {row.change24h.toFixed(2)}%)
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {transactions.length === 0 ? (
                <Text style={styles.emptyText}>No wallet activity yet.</Text>
              ) : (
                transactions.map((transaction) => (
                  <TouchableOpacity
                    key={transaction._id}
                    style={styles.transactionRow}
                    onPress={() => navigation.navigate('TransactionDetails', { transaction })}
                  >
                    <View>
                      <Text style={styles.assetName}>{transaction.description || transaction.type}</Text>
                      <Text style={styles.assetMeta}>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {transaction.type === 'receive' || transaction.type === 'deposit' ? '+' : '-'}
                      {tokenFormatter(transaction.amount, transaction.symbol, 2)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Saved Bank Accounts</Text>
              {(wallet?.bankAccounts || []).map((account) => (
                <View key={account._id} style={styles.transactionRow}>
                  <View>
                    <Text style={styles.assetName}>{account.bankName}</Text>
                    <Text style={styles.assetMeta}>
                      {account.accountNumber} • {account.accountName}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeBankAccount(account._id)}>
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                style={styles.input}
                value={bankForm.bankName}
                onChangeText={(bankName) => setBankForm((current) => ({ ...current, bankName }))}
                placeholder="Bank name"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={bankForm.bankCode}
                onChangeText={(bankCode) => setBankForm((current) => ({ ...current, bankCode }))}
                placeholder="Bank code"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={styles.input}
                value={bankForm.accountNumber}
                onChangeText={(accountNumber) => setBankForm((current) => ({ ...current, accountNumber }))}
                placeholder="Account number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                value={bankForm.accountName}
                onChangeText={(accountName) => setBankForm((current) => ({ ...current, accountName }))}
                placeholder="Account name"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity style={styles.primaryAction} onPress={saveBankAccount} disabled={savingBank}>
                {savingBank ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <>
                    <Icon name="plus" size={18} color={colors.black} />
                    <Text style={styles.primaryActionText}>Save bank account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {activeTab === 'receive' ? (
          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Select network</Text>
              <View style={styles.chainRow}>
                {(wallet?.wallets || []).map((item) => (
                  <TouchableOpacity
                    key={item.chainId}
                    style={[styles.chainChip, selectedChain === item.chainId && styles.chainChipActive]}
                    onPress={() => setSelectedChain(item.chainId)}
                  >
                    <Text style={[styles.chainChipText, selectedChain === item.chainId && styles.chainChipTextActive]}>
                      {item.chain.symbol}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Deposit address</Text>
              {loadingAddress ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.assetMeta}>{depositAddress?.address || 'Unable to load address.'}</Text>
                  {depositAddress?.explorerUrl ? (
                    <Text style={styles.assetMeta}>{depositAddress.explorerUrl}</Text>
                  ) : null}
                  {depositAddress?.address ? (
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => copyValue(depositAddress.address, 'Deposit address')}>
                      <Icon name="content-copy" size={18} color={colors.primary} />
                      <Text style={styles.secondaryActionText}>Copy address</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Fiat funding account</Text>
              <Text style={styles.assetMeta}>
                {wallet?.fiatAccounts?.NGN?.bankName} • {wallet?.fiatAccounts?.NGN?.accountNumber}
              </Text>
              <Text style={styles.assetMeta}>{wallet?.fiatAccounts?.NGN?.accountName}</Text>
              <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Deposit')}>
                <Icon name="bank-transfer-in" size={18} color={colors.black} />
                <Text style={styles.primaryActionText}>Create deposit instructions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {activeTab === 'keys' ? (
          <View style={styles.content}>
            <TouchableOpacity style={styles.keysButton} onPress={() => navigation.navigate('KeyManagement')}>
              <Icon name="key" size={24} color={colors.primary} />
              <View style={styles.keysButtonText}>
                <Text style={styles.keysButtonTitle}>Manage Recovery Phrase</Text>
                <Text style={styles.keysButtonSubtitle}>Export your mnemonic and private keys</Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Wallet Info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>Non-custodial</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Primary Chain</Text>
                <Text style={styles.infoValue}>{wallet?.primaryWallet?.chain?.name || 'Solana'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{wallet?.walletAddress || 'Unavailable'}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    tabContainer: {
      flexDirection: 'row',
      padding: 20,
      gap: 8
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    tabActive: {
      backgroundColor: colors.primary
    },
    tabText: {
      color: colors.textMuted,
      fontWeight: '600'
    },
    tabTextActive: {
      color: colors.black
    },
    content: {
      padding: 20
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 120
    },
    totalCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 24,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    totalLabel: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 8
    },
    totalValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text
    },
    totalSubtext: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 8,
      textAlign: 'center'
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20
    },
    primaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14
    },
    primaryActionText: {
      color: colors.black,
      fontWeight: '700'
    },
    secondaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16
    },
    secondaryActionText: {
      color: colors.primary,
      fontWeight: '700'
    },
    assetCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12
    },
    assetIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center'
    },
    assetIconText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.white
    },
    assetInfo: {
      flex: 1,
      marginLeft: 12
    },
    assetName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600'
    },
    assetBalance: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2
    },
    assetMeta: {
      marginTop: 6,
      color: colors.textMuted,
      fontSize: 12
    },
    assetActions: {
      gap: 8
    },
    assetAction: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10
    },
    assetActionText: {
      color: colors.primary,
      fontWeight: '700'
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    infoLabel: {
      color: colors.textMuted
    },
    infoValue: {
      color: colors.text,
      flex: 1,
      marginLeft: 12,
      textAlign: 'right'
    },
    transactionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    deleteText: {
      color: colors.danger,
      fontWeight: '700'
    },
    emptyText: {
      color: colors.textMuted
    },
    chainRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    chainChip: {
      backgroundColor: colors.cardAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10
    },
    chainChipActive: {
      borderColor: colors.primary
    },
    chainChipText: {
      color: colors.text
    },
    chainChipTextActive: {
      color: colors.primary,
      fontWeight: '700'
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 10
    },
    keysButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    keysButtonText: {
      flex: 1,
      marginLeft: 16
    },
    keysButtonTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text
    },
    keysButtonSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4
    }
  });
