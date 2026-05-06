import { create } from 'zustand';
import { transferAPI, withdrawalAPI } from '../api/client';
import { chainCurrencyFor } from '../api/client';

export const useTransferStore = create((set, get) => ({
  transferHistory: [],
  isLoading: false,
  error: null,
  recentRecipients: [],

  validateUsername: async (username) => {
    try {
      const response = await transferAPI.validateUsername(username);
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  },

  executeTransfer: async ({ recipient, recipientType, chain, amount, note, pin }) => {
    set({ isLoading: true, error: null });
    try {
      let response;

      if (recipientType === 'username') {
        response = await transferAPI.sendByUsername({
          toUsername: recipient,
          amount,
          currency: chainCurrencyFor(chain),
          chainId: chain,
          description: note,
          pin
        });

        get().addRecentRecipient({
          username: recipient,
          chain,
          timestamp: Date.now()
        });
      } else {
        response = await withdrawalAPI.withdrawCrypto({
          chainId: chain,
          token: chainCurrencyFor(chain),
          amount,
          toAddress: recipient,
          pin
        });
      }

      await get().fetchTransferHistory();
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Transfer failed';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  fetchTransferHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await transferAPI.getHistory();
      set({
        transferHistory: response.data.transfers || [],
        isLoading: false
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch transfer history';
      set({ isLoading: false, error: message });
      return { transfers: [] };
    }
  },

  addRecentRecipient: (recipient) => {
    const recentRecipients = get().recentRecipients || [];
    const filtered = recentRecipients.filter((item) => item.username !== recipient.username);
    set({ recentRecipients: [recipient, ...filtered].slice(0, 5) });
  },

  getTransferById: (id) => {
    return (get().transferHistory || []).find((transfer) => transfer._id === id);
  },

  clearError: () => set({ error: null }),

  reset: () => {
    set({
      transferHistory: [],
      isLoading: false,
      error: null,
      recentRecipients: []
    });
  }
}));
