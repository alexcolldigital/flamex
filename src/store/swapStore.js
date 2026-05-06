import { create } from 'zustand';
import { swapAPI } from '../api/client';

export const useSwapStore = create((set, get) => ({
  // State
  tokens: [],
  swapHistory: [],
  quote: null,
  isLoading: false,
  error: null,
  slippage: 0.5, // Default 0.5% slippage

  // Actions
  fetchTokens: async (chain) => {
    set({ isLoading: true, error: null });
    try {
      const response = await swapAPI.getTokens(chain);
      const tokens = response.data.tokens || [];
      set({ tokens, isLoading: false });
      return tokens;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to fetch tokens',
        isLoading: false
      });
      return [];
    }
  },

  getQuote: async (params) => {
    set({ isLoading: true, error: null, quote: null });
    
    try {
      const response = await swapAPI.getQuote({
        ...params,
        fromAmount: params.fromAmount || params.amount,
        slippage: params.slippage ?? get().slippage
      });
      const data = response.data;
      set({ quote: data, isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to get quote',
        isLoading: false
      });
      return null;
    }
  },

  executeSwap: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await swapAPI.execute({
        ...params,
        fromAmount: params.fromAmount || params.amount
      });
      const data = response.data;
      
      await get().fetchSwapHistory();
      
      set({ isLoading: false, quote: null });
      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Swap failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  fetchSwapHistory: async () => {
    try {
      const response = await swapAPI.getHistory();
      const swaps = response.data.swaps || [];
      set({ swapHistory: swaps });
      return swaps;
    } catch (error) {
      console.error('Fetch swap history error:', error);
      return [];
    }
  },

  setSlippage: (slippage) => {
    set({ slippage });
  },

  clearQuote: () => {
    set({ quote: null });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      tokens: [],
      swapHistory: [],
      quote: null,
      isLoading: false,
      error: null,
      slippage: 0.5,
    });
  },
}));
