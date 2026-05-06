import { create } from 'zustand';
import { referralAPI } from '../api/client';

export const useReferralStore = create((set, get) => ({
  referralData: null,
  leaderboard: [],
  isLoading: false,
  error: null,

  fetchReferralData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await referralAPI.getData();
      set({ referralData: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch referral data';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchLeaderboard: async () => {
    try {
      const response = await referralAPI.getLeaderboard();
      set({ leaderboard: response.data.leaderboard || [] });
      return response.data;
    } catch (error) {
      return { leaderboard: [] };
    }
  },

  claimRewards: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await referralAPI.claimRewards();
      await get().fetchReferralData();
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to claim rewards';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  generateReferralLink: async () => {
    try {
      const response = await referralAPI.generateLink();
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  reset: () => {
    set({
      referralData: null,
      leaderboard: [],
      isLoading: false,
      error: null
    });
  }
}));
