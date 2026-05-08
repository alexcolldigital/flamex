import { Platform } from 'react-native';

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');
const PRODUCTION_API_ORIGIN = 'https://flamex-backend.onrender.com';

const DEFAULT_API_ORIGIN = {
  android: PRODUCTION_API_ORIGIN,
  ios: PRODUCTION_API_ORIGIN,
  web: PRODUCTION_API_ORIGIN,
  default: PRODUCTION_API_ORIGIN
};

export const API_ORIGIN = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL ||
    DEFAULT_API_ORIGIN[Platform.OS] ||
    DEFAULT_API_ORIGIN.default
);

export const API_BASE_URL = `${API_ORIGIN}/api`;
export const REQUEST_TIMEOUT = 30000;

export const CHAIN_TO_CURRENCY = {
  solana: 'SOL',
  ethereum: 'ETH',
  bsc: 'BNB',
  polygon: 'MATIC',
  base: 'ETH',
  arbitrum: 'ETH'
};

export const CURRENCY_TO_CHAIN = {
  SOL: 'solana',
  ETH: 'ethereum',
  BNB: 'bsc',
  MATIC: 'polygon',
  USDT: 'solana',
  USDC: 'solana',
  FLAME: 'solana',
  NGN: 'solana',
  USD: 'ethereum'
};
