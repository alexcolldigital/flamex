import { create } from 'zustand';
import { walletAPI } from '../api/client';
import { chainCurrencyFor } from '../api/client';
import { useAuthStore } from './authStore';

const buildChainBalances = (summary) => {
  const balances = {};

  (summary?.wallets || []).forEach((wallet) => {
    const currency = wallet?.chain?.symbol || chainCurrencyFor(wallet.chainId);
    balances[wallet.chainId] = {
      native: summary?.balances?.[currency] || 0,
      symbol: currency,
      address: wallet.address
    };
  });

  return balances;
};

export const useWalletStore = create((set, get) => ({
  wallets: [],
  balances: {},
  rawBalances: {},
  transactions: [],
  summary: null,
  isLoading: false,
  error: null,

  initializeWallets: async () => {
    const user = useAuthStore.getState().user;
    if (user?.wallets) {
      set({ wallets: user.wallets });
    }
    return { success: true };
  },

  fetchBalances: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletAPI.getSummary();
      const summary = response.data;
      set({
        wallets: summary.wallets || [],
        balances: buildChainBalances(summary),
        rawBalances: summary.balances || {},
        summary,
        isLoading: false
      });
      return { success: true, summary };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load wallet balances';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  fetchBalance: async () => {
    return get().fetchBalances();
  },

  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletAPI.getTransactions(params);
      set({
        transactions: response.data.transactions || [],
        isLoading: false
      });
      return { success: true, ...response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load transactions';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  exportKeys: async (password, chainId) => {
    try {
      const response = await walletAPI.exportKeys(password, chainId);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export keys'
      };
    }
  },

  refreshSummary: async () => {
    return get().fetchBalances();
  },

  getWalletByChain: (chain) => {
    const wallets = get().summary?.wallets || [];
    return wallets.find((wallet) => wallet.chainId === chain);
  },

  getBalance: (chain, token = 'native') => {
    const balance = get().balances?.[chain];
    return token === 'native' ? balance?.native || 0 : balance?.[token] || 0;
  },

  clearWallets: async () => {
    set({
      wallets: [],
      balances: {},
      rawBalances: {},
      transactions: [],
      summary: null
    });
  },

  clearError: () => set({ error: null }),

  reset: () => {
    set({
      wallets: [],
      balances: {},
      rawBalances: {},
      transactions: [],
      summary: null,
      isLoading: false,
      error: null
    });
  }
}));
