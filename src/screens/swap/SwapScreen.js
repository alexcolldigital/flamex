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
import { priceAPI, swapAPI, walletAPI } from '../../api/client';
import { currencyFormatter, normalizeTransaction, tokenFormatter } from '../../lib/finance';
import { useAppTheme } from '../../theme/ThemeProvider';

const CHAIN_OPTIONS = ['solana', 'ethereum'];

export default function SwapScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [fromChain, setFromChain] = useState('solana');
  const [toChain, setToChain] = useState('solana');
  const [tokenOptions, setTokenOptions] = useState({ solana: [], ethereum: [] });
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);

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
    try {
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
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!amount || Number(amount) <= 0) return;

    setLoadingSwap(true);
    try {
      await swapAPI.execute({
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount: Number(amount),
        toAmount: quote?.toAmount ? Number(quote.toAmount) : undefined
      });
      setAmount('');
      setQuote(null);
      await loadData();
    } catch (error) {
      console.log('Swap failed:', error);
    } finally {
      setLoadingSwap(false);
    }
  };

  const fromBalance = wallet?.balances?.[fromToken] || 0;
  const ngnEstimate = Number(prices[fromToken]?.ngn || 0) * Number(amount || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Swap</Text>
        <Text style={styles.headerSubtitle}>Quotes, execution, and recent swap history</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                  {chain}
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
                  {chain}
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
                <Text style={styles.infoLabel}>ETA</Text>
                <Text style={styles.infoValue}>{quote.estimatedTime ? `${quote.estimatedTime}s` : 'Instant'}</Text>
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
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12
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
    content: {
      flex: 1,
      padding: 20
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
