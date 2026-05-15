import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  API_BASE_URL,
  CHAIN_TO_CURRENCY,
  CURRENCY_TO_CHAIN,
  REQUEST_TIMEOUT
} from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  setupPin: (pin) => apiClient.post('/auth/setup-pin', { pin }),
  changePin: (currentPin, newPin) => apiClient.post('/auth/change-pin', { currentPin, newPin }),
  verifyPin: (pin) => apiClient.post('/auth/verify-pin', { pin }),
  requestEmailOtp: (email, purpose = 'verify_email') =>
    apiClient.post('/auth/request-email-otp', { email, purpose }),
  verifyEmailOtp: (email, code, purpose = 'verify_email') =>
    apiClient.post('/auth/verify-email-otp', { email, code, purpose }),
  requestPinResetOtp: (email) => apiClient.post('/auth/request-pin-reset-otp', { email }),
  resetPinWithOtp: (email, code, newPin) =>
    apiClient.post('/auth/reset-pin-with-otp', { email, code, newPin }),
  setUsername: (username) => apiClient.post('/auth/set-username', { username }),
  checkUsername: (username) => apiClient.get(`/auth/check-username/${username}`),
  updateProfile: (updates) => apiClient.put('/auth/profile', updates),
  submitKyc: (data) => apiClient.post('/auth/kyc', data),
  getPreferences: () => apiClient.get('/auth/preferences'),
  updatePreferences: (data) => apiClient.put('/auth/preferences', data),
  updateSecurity: (data) => apiClient.put('/auth/security', data)
};

export const walletAPI = {
  getWallet: () => apiClient.get('/wallet'),
  getSummary: () => apiClient.get('/wallet/summary'),
  getBalances: () => apiClient.get('/wallet/balances'),
  getTransactions: (params = {}) => apiClient.get('/wallet/transactions', { params }),
  exportKeys: (password, chainId) => apiClient.post('/wallet/export-keys', { password, chainId }),
  addBankAccount: (data) => apiClient.post('/wallet/bank-account', data),
  removeBankAccount: (id) => apiClient.delete(`/wallet/bank-account/${id}`),
  getVirtualCard: () => apiClient.get('/wallet/virtual-card'),
  createVirtualCard: (data = {}) => apiClient.post('/wallet/virtual-card', data),
  fundCard: (data) => apiClient.post('/wallet/virtual-card/fund', data),
  freezeCard: () => apiClient.post('/wallet/virtual-card/freeze'),
  swap: ({ fromCurrency, toCurrency, amount, receiveAmount }) =>
    apiClient.post('/swap/execute', {
      fromChain: CURRENCY_TO_CHAIN[fromCurrency] || 'solana',
      toChain: CURRENCY_TO_CHAIN[toCurrency] || 'solana',
      fromToken: fromCurrency,
      toToken: toCurrency,
      fromAmount: amount,
      toAmount: receiveAmount
    })
};

export const priceAPI = {
  getPrices: () => apiClient.get('/prices'),
  getNgnRate: () => apiClient.get('/prices/ngn')
};

export const stakingAPI = {
  getConfig: () => apiClient.get('/staking/config'),
  getPositions: () => apiClient.get('/staking/positions'),
  getStats: () => apiClient.get('/staking/stats'),
  createStake: (data) => apiClient.post('/staking/stake', data)
};

export const transferAPI = {
  validateUsername: (username) => apiClient.get(`/transfer/validate-username/${username}`),
  sendByUsername: (data) => apiClient.post('/transfer/username', data),
  getHistory: () => apiClient.get('/transfer/history')
};

export const depositAPI = {
  getAddress: (chainId) => apiClient.get(`/deposit/address/${chainId}`),
  createNgnDeposit: (amount, method = 'checkout') => apiClient.post('/deposit/ngn', { amount, method }),
  verifyNgnDeposit: (reference, transactionId) =>
    apiClient.post('/deposit/verify', { reference, transactionId })
};

export const withdrawalAPI = {
  getBanks: () => apiClient.get('/withdrawal/banks'),
  verifyAccount: (bankCode, accountNumber) =>
    apiClient.post('/withdrawal/verify-account', { bankCode, accountNumber }),
  withdrawNgn: (data) => apiClient.post('/withdrawal/ngn', data),
  withdrawCrypto: (data) => apiClient.post('/withdrawal/crypto', data)
};

export const referralAPI = {
  getData: () => apiClient.get('/referral'),
  getLeaderboard: () => apiClient.get('/referral/leaderboard'),
  claimRewards: () => apiClient.post('/referral/claim'),
  generateLink: () => apiClient.post('/referral/link')
};

export const swapAPI = {
  getTokens: (chain = 'solana') => apiClient.get('/swap/tokens', { params: { chain } }),
  getQuote: (params) => apiClient.get('/swap/quote', { params }),
  execute: (data) => apiClient.post('/swap/execute', data),
  getHistory: () => apiClient.get('/swap/history')
};

export const billsAPI = {
  getProviders: (type) => apiClient.get(type ? `/bills/providers/${type}` : '/bills/providers'),
  getDataPlans: (provider) => apiClient.get(`/bills/data-plans/${provider}`),
  getCablePackages: (provider) => apiClient.get(`/bills/cable-packages/${provider}`),
  getGiftCardRates: () => apiClient.get('/bills/giftcard-rates'),
  getGiftCardTrades: () => apiClient.get('/bills/giftcard-trades'),
  validatePhone: (phoneNumber) => apiClient.post('/bills/validate-phone', { phoneNumber }),
  validateMeter: (provider, meterNumber, meterType) =>
    apiClient.post('/bills/validate-meter', { provider, meterNumber, meterType }),
  validateSmartCard: (provider, smartCardNumber) =>
    apiClient.post('/bills/validate-smartcard', { provider, smartCardNumber }),
  buyAirtime: (data) => apiClient.post('/bills/airtime', data),
  buyData: (data) => apiClient.post('/bills/data', data),
  payElectricity: (data) => apiClient.post('/bills/electricity', data),
  payCable: (data) => apiClient.post('/bills/cable', data),
  payBetting: (data) => apiClient.post('/bills/betting', data),
  submitGiftCardTrade: (data) => apiClient.post('/bills/giftcard-trade', data),
  getHistory: (params = {}) => apiClient.get('/bills/history', { params })
};

export const p2pAPI = {
  getOffers: (params = {}) => apiClient.get('/p2p/offers', { params }),
  getMyOffers: () => apiClient.get('/p2p/offers/mine'),
  createOffer: (data) => apiClient.post('/p2p/offers', data),
  updateOffer: (offerId, data) => apiClient.patch(`/p2p/offers/${offerId}`, data),
  createOrder: (offerId, cryptoAmount) => apiClient.post(`/p2p/offers/${offerId}/order`, { cryptoAmount }),
  getOrders: () => apiClient.get('/p2p/orders'),
  getOrder: (orderId) => apiClient.get(`/p2p/orders/${orderId}`),
  markPaid: (orderId, data) => apiClient.post(`/p2p/orders/${orderId}/mark-paid`, data),
  confirmPayment: (orderId, data) => apiClient.post(`/p2p/orders/${orderId}/confirm-payment`, data),
  cancelOrder: (orderId, data) => apiClient.post(`/p2p/orders/${orderId}/cancel`, data),
  sendOrderMessage: (orderId, message) => apiClient.post(`/p2p/orders/${orderId}/message`, { message }),
  openDispute: (orderId, data) => apiClient.post(`/p2p/orders/${orderId}/dispute`, data),
  getDisputes: (params = {}) => apiClient.get('/p2p/disputes', { params }),
  sendDisputeMessage: (disputeId, message) => apiClient.post(`/p2p/disputes/${disputeId}/message`, { message }),
  resolveDispute: (disputeId, data) => apiClient.post(`/p2p/disputes/${disputeId}/resolve`, data)
};

export const notificationAPI = {
  getAll: () => apiClient.get('/notifications'),
  markRead: (notificationId) => apiClient.post(`/notifications/${notificationId}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all'),
  deleteOne: (notificationId) => apiClient.delete(`/notifications/${notificationId}`),
  clearAll: () => apiClient.delete('/notifications')
};

export const chainCurrencyFor = (chainId) => CHAIN_TO_CURRENCY[chainId] || 'SOL';

export default apiClient;
