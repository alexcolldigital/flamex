import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { priceAPI, swapAPI, walletAPI } from '../../api/client';
import BillPinModal from '../../components/BillPinModal';
import { currencyFormatter, normalizeTransaction, tokenFormatter } from '../../lib/finance';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const CHAIN_OPTIONS = ['fiat', 'solana', 'ethereum'];

export default function SwapScreen({ navigation }) {
  const { colors } = useAppTheme();
  const { verifyPin } = useAuthStore();
  const { unreadCount, initializeNotifications } = useNotificationStore();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [fromChain, setFromChain] = useState('solana');
  const [toChain, setToChain] = useState('solana');
  const [tokenOptions, setTokenOptions] = useState({ fiat: [{ symbol: 'USD' }, { symbol: 'NGN' }], solana: [], ethereum: [] });
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const loadData = async () => {
    try {
      const [walletRes, pricesRes, solanaTokensRes, ethereumTokensRes, historyRes] = await Promise.all([
        walletAPI.getWallet(),
        priceAPI.getPrices(),
        swapAPI.getTokens('solana'),
        swapAPI.getTokens('ethereum'),
        swapAPI.getHistory()
      ]);

      setWallet(walletRes.data);
      setPrices(pricesRes.data);
      setTokenOptions({
        fiat: [{ symbol: 'USD' }, { symbol: 'NGN' }],
        solana: solanaTokensRes.data.tokens || [],
        ethereum: ethereumTokensRes.data.tokens || []
      });
      setHistory((historyRes.data.swaps || []).map(normalizeTransaction));
    } catch (error) {
      console.log('Load swap data error:', error);
    }
  };

  useEffect(() => {
    loadData();
    initializeNotifications();
  }, []);

  useEffect(() => {
    const fromOptions = tokenOptions[fromChain] || [];
    const toOptions = tokenOptions[toChain] || [];

    if (fromOptions.length && !fromOptions.find((token) => token.symbol === fromToken)) {
      setFromToken(fromOptions[0].symbol);
    }

    if (toOptions.length && !toOptions.find((token) => token.symbol === toToken)) {
      const fallback = toOptions.find((token) => token.symbol !== fromToken) || toOptions[0];
      if (fallback) {
        setToToken(fallback.symbol);
      }
    }
  }, [fromChain, toChain, tokenOptions]);

  const requestQuote = async () => {
    if (!amount || Number(amount) <= 0) return;

    setLoadingQuote(true);
    setErrorMessage('');
    try {
      const getNgnPrice = (token) => {
        if (token === 'NGN') return 1;
        if (token === 'USD') {
          return Number(prices.USDT?.ngn || 1500) / Number(prices.USDT?.usd || 1);
        }
        return Number(prices[token]?.ngn || 0);
      };

      if (fromChain === 'fiat' || toChain === 'fiat') {
        const fromNgnPrice = getNgnPrice(fromToken);
        const toNgnPrice = getNgnPrice(toToken);
        if (!fromNgnPrice || !toNgnPrice) {
          throw new Error('FX rate unavailable for this currency pair.');
        }
        const rate = fromNgnPrice / toNgnPrice;
        const grossAmount = Number(amount) * rate;
        const toAmount = Number((grossAmount * 0.995).toFixed(toToken === 'NGN' ? 2 : 8));
        setQuote({
          type: 'ledger-fx',
          provider: 'FlameX FX',
          fromToken,
          toToken,
          fromAmount: Number(amount),
          toAmount,
          minimumReceived: toAmount,
          priceImpact: '0',
          exchangeRate: Number(rate.toFixed(8)),
          fee: Number((grossAmount - toAmount).toFixed(2))
        });
        return;
      }
      const response = await swapAPI.getQuote({
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount: Number(amount),
        slippage: 0.5
      });
      setQuote(response.data);
    } catch (error) {
      setQuote(null);
      setErrorMessage(error.response?.data?.message || 'Unable to get a quote.');
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!amount || Number(amount) <= 0) return;

    const quotedFee = Number(quote?.fee || 0);
    if (Number(fromBalance) < Number(amount) + quotedFee) {
      setErrorMessage(`Insufficient available ${fromToken} balance`);
      return;
    }

    setPin('');
    setShowPinModal(true);
  };

  const confirmSwap = async () => {
    if (pin.length !== 4) return;

    const isValid = await verifyPin(pin);
    if (!isValid) {
      setPin('');
      setErrorMessage('Invalid transaction PIN.');
      return;
    }

    setShowPinModal(false);
    setLoadingSwap(true);
    setErrorMessage('');
    try {
      await swapAPI.execute({
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount: Number(amount),
        toAmount: quote?.toAmount ? Number(quote.toAmount) : undefined,
        pin
      });
      setAmount('');
      setQuote(null);
      await loadData();
    } catch (error) {
      console.log('Swap failed:', error);
      setErrorMessage(error.response?.data?.message || 'Swap failed.');
    } finally {
      setLoadingSwap(false);
    }
  };

  const fromBalance = wallet?.balances?.[fromToken] || 0;
  const usdToNgn = Number(prices.USDT?.ngn || 1500) / Number(prices.USDT?.usd || 1);
  const ngnEstimate = fromToken === 'USD'
    ? usdToNgn * Number(amount || 0)
    : Number(prices[fromToken]?.ngn || 0) * Number(amount || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Swap</Text>
            <Text style={styles.headerSubtitle}>Quotes, execution, and recent swap history</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tokenCard}>
          <Text style={styles.sectionTitle}>From</Text>
          <View style={styles.chainRow}>
            {CHAIN_OPTIONS.map((chain) => (
              <TouchableOpacity
                key={chain}
                style={[styles.chainChip, fromChain === chain && styles.chainChipActive]}
                onPress={() => setFromChain(chain)}
              >
                <Text style={[styles.chainChipText, fromChain === chain && styles.chainChipTextActive]}>
                  {chain === 'fiat' ? 'fiat' : chain}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tokenRow}>
            {(tokenOptions[fromChain] || []).map((token) => (
              <TouchableOpacity
                key={token.symbol}
                style={[styles.tokenOption, fromToken === token.symbol && styles.tokenOptionActive]}
                onPress={() => setFromToken(token.symbol)}
              >
                <Text style={styles.tokenText}>{token.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.balanceText}>
            Balance: {tokenFormatter(fromBalance, fromToken)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.swapButton}
          onPress={() => {
            const nextFromChain = toChain;
            const nextFromToken = toToken;
            setToChain(fromChain);
            setToToken(fromToken);
            setFromChain(nextFromChain);
            setFromToken(nextFromToken);
            setQuote(null);
          }}
        >
          <Icon name="swap-vertical" size={24} color={colors.black} />
        </TouchableOpacity>

        <View style={styles.tokenCard}>
          <Text style={styles.sectionTitle}>To</Text>
          <View style={styles.chainRow}>
            {CHAIN_OPTIONS.map((chain) => (
              <TouchableOpacity
                key={chain}
                style={[styles.chainChip, toChain === chain && styles.chainChipActive]}
                onPress={() => setToChain(chain)}
              >
                <Text style={[styles.chainChipText, toChain === chain && styles.chainChipTextActive]}>
                  {chain === 'fiat' ? 'fiat' : chain}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tokenRow}>
            {(tokenOptions[toChain] || []).map((token) => (
              <TouchableOpacity
                key={token.symbol}
                style={[styles.tokenOption, toToken === token.symbol && styles.tokenOptionActive]}
                onPress={() => setToToken(token.symbol)}
              >
                <Text style={styles.tokenText}>{token.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.receiveAmount}>
            {quote?.toAmount ? `${quote.toAmount} ${toToken}` : 'Request a quote'}
          </Text>
          <Text style={styles.balanceText}>
            Est. source value: {ngnEstimate ? currencyFormatter(ngnEstimate) : '—'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={requestQuote} disabled={loadingQuote}>
            {loadingQuote ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Icon name="chart-timeline-variant" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Get quote</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSwap} disabled={loadingSwap || !quote}>
            {loadingSwap ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.primaryButtonText}>Execute swap</Text>
            )}
          </TouchableOpacity>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quote details</Text>
          {quote ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Route</Text>
                <Text style={styles.infoValue}>{quote.provider || 'direct'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Minimum received</Text>
                <Text style={styles.infoValue}>{quote.minimumReceived || quote.toAmount || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Price impact</Text>
                <Text style={styles.infoValue}>{quote.priceImpact || '0'}%</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Platform fee</Text>
                <Text style={styles.infoValue}>{quote.fee || 0} {quote.feeCurrency || fromToken}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ETA</Text>
                <Text style={styles.infoValue}>{quote.type === 'ledger-fx' ? `1 ${fromToken} = ${quote.exchangeRate} ${toToken}` : quote.estimatedTime ? `${quote.estimatedTime}s` : 'Instant'}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Request a quote to preview provider, route, and minimum receive.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent swaps</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No swaps recorded yet.</Text>
          ) : (
            history.slice(0, 6).map((item) => (
              <View key={item._id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyTitle}>
                    {item.fromCurrency || item.symbol} → {item.toCurrency || toToken}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>{tokenFormatter(item.amount, item.symbol, 2)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <BillPinModal
        visible={showPinModal}
        pin={pin}
        setPin={setPin}
        loading={loadingSwap}
        onConfirm={confirmSwap}
        onClose={() => setShowPinModal(false)}
        title="Confirm swap"
        subtitle="Enter your 4-digit transaction PIN before completing this swap"
      />
    </SafeAreaView>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text
    },
    headerSubtitle: {
      color: colors.textMuted,
      marginTop: 4
    },
    notifBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    notifBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#ef4444',
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3
    },
    notifBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: 'bold'
    },
    content: {
      flex: 1,
      padding: 20
    },
    contentContainer: {
      paddingBottom: 120
    },
    tokenCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12
    },
    chainRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12
    },
    chainChip: {
      backgroundColor: colors.cardAlt,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border
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
    tokenRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 12
    },
    tokenOption: {
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    tokenOptionActive: {
      borderColor: colors.primary
    },
    tokenText: {
      color: colors.text,
      fontWeight: '600'
    },
    amountInput: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.text,
      marginTop: 10
    },
    receiveAmount: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 10
    },
    balanceText: {
      marginTop: 8,
      color: colors.textMuted
    },
    swapButton: {
      alignSelf: 'center',
      marginVertical: -18,
      zIndex: 1,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center'
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      marginBottom: 20
    },
    errorText: {
      color: colors.danger || '#ef4444',
      fontWeight: '600',
      marginBottom: 16
    },
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primarySoft,
      borderRadius: 16,
      paddingVertical: 18
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: '700'
    },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18
    },
    primaryButtonText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: '700'
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    infoLabel: {
      color: colors.textMuted
    },
    infoValue: {
      color: colors.text,
      fontWeight: '600'
    },
    emptyText: {
      color: colors.textMuted
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    historyTitle: {
      color: colors.text,
      fontWeight: '600'
    },
    historyMeta: {
      color: colors.textMuted,
      marginTop: 4,
      fontSize: 12
    },
    historyAmount: {
      color: colors.text,
      fontWeight: '700'
    }
  });
