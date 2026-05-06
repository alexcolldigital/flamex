export const CHAIN_OPTIONS = [
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', color: '#F3BA2F' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
  { id: 'base', name: 'Base', symbol: 'ETH', color: '#0052FF' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0' }
];

export const DEFAULT_TOKENS = [
  { symbol: 'NGN', name: 'Nigerian Naira', color: '#16a34a', chainId: null },
  { symbol: 'USD', name: 'US Dollar Balance', color: '#2563eb', chainId: null },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF', chainId: 'solana' },
  { symbol: 'USDT', name: 'Tether USD', color: '#26A17B', chainId: 'solana' },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA', chainId: 'solana' },
  { symbol: 'FLAME', name: 'Flame Token', color: '#FF6B00', chainId: 'solana' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', chainId: 'ethereum' },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', chainId: 'bsc' }
];

export const currencyFormatter = (value, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2
  }).format(Number(value || 0));

export const tokenFormatter = (value, symbol, digits = 4) =>
  `${Number(value || 0).toFixed(digits)} ${symbol}`;

export const getChainMeta = (chainId) =>
  CHAIN_OPTIONS.find((chain) => chain.id === chainId) || {
    id: chainId,
    name: chainId,
    symbol: String(chainId || '').toUpperCase(),
    color: '#64748B'
  };

export const getTokenMeta = (symbol) =>
  DEFAULT_TOKENS.find((token) => token.symbol === symbol) || {
    symbol,
    name: symbol,
    color: '#64748B',
    chainId: null
  };

export const buildPriceRows = (prices = {}) =>
  Object.entries(prices).map(([symbol, values]) => ({
    symbol,
    ...getTokenMeta(symbol),
    usd: Number(values?.usd || 0),
    ngn: Number(values?.ngn || 0),
    change24h: Number(values?.change24h || 0)
  }));

export const normalizeTransaction = (transaction = {}) => {
  const typeMap = {
    user_transfer_sent: 'send',
    user_transfer_received: 'receive',
    cross_chain_swap: 'swap',
    virtual_card: 'virtual_card',
    bill_payment: 'bill',
    giftcard: 'bill',
    airtime: 'bill',
    data: 'bill',
    electricity: 'bill',
    cable: 'bill',
    betting: 'bill',
    p2p_buy: 'receive',
    p2p_sell: 'send'
  };

  return {
    ...transaction,
    symbol: transaction.symbol || transaction.currency || transaction.fromCurrency || 'NGN',
    chain: transaction.chain || transaction.chainId || transaction.fromChainId || null,
    type: typeMap[transaction.type] || transaction.type || 'transaction',
    amount: Number(transaction.amount || transaction.fromAmount || 0)
  };
};
