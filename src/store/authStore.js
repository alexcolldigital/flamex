import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authAPI } from '../api/client';

const persistSession = async (token, user) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  preferences: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const [token, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user')
      ]);

      if (!token || !storedUser) {
        set({ isLoading: false });
        return false;
      }

      set({
        token,
        user: JSON.parse(storedUser),
        isAuthenticated: true,
        isLoading: false
      });

      await get().fetchUserProfile();
      return true;
    } catch (error) {
      await AsyncStorage.multiRemove(['token', 'user']);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      await persistSession(token, user);
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      await persistSession(token, user);
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false
      });

      return {
        success: true,
        requiresEmailVerification: user.emailVerified !== true,
        emailVerificationSent: response.data.emailVerificationSent === true
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    set({
      user: null,
      token: null,
      preferences: null,
      isAuthenticated: false,
      error: null
    });
  },

  setUsername: async (username) => {
    try {
      const response = await authAPI.setUsername(username);
      const currentUser = get().user || {};
      const updatedUser = { ...currentUser, username: response.data.username };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });

      return { success: true, username: response.data.username };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to set username'
      };
    }
  },

  changePin: async (currentPin, newPin) => {
    try {
      await authAPI.changePin(currentPin, newPin);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to change PIN'
      };
    }
  },

  setupPin: async (pin) => {
    try {
      await authAPI.setupPin(pin);
      const updatedUser = { ...get().user, hasTransactionPin: true };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to set PIN'
      };
    }
  },

  updateProfile: async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      const updatedUser = response.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true, user: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile'
      };
    }
  },

  submitKyc: async (data) => {
    try {
      const response = await authAPI.submitKyc(data);
      const updatedUser = response.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'KYC submission failed'
      };
    }
  },

  checkUsernameAvailability: async (username) => {
    try {
      const response = await authAPI.checkUsername(username);
      return response.data.available;
    } catch (error) {
      return false;
    }
  },

  verifyPin: async (pin) => {
    try {
      const response = await authAPI.verifyPin(pin);
      return response.data.valid;
    } catch (error) {
      return false;
    }
  },

  requestEmailOtp: async (email, purpose = 'verify_email') => {
    try {
      const response = await authAPI.requestEmailOtp(email, purpose);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send email OTP'
      };
    }
  },

  verifyEmailOtp: async (email, code, purpose = 'verify_email') => {
    try {
      const response = await authAPI.verifyEmailOtp(email, code, purpose);
      const currentUser = get().user || {};
      if (purpose === 'verify_email' && currentUser.email === email) {
        const updatedUser = {
          ...currentUser,
          emailVerified: true
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify email OTP'
      };
    }
  },

  requestPinResetOtp: async (email) => {
    try {
      const response = await authAPI.requestPinResetOtp(email);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send PIN reset OTP'
      };
    }
  },

  resetPinWithOtp: async (email, code, newPin) => {
    try {
      const response = await authAPI.resetPinWithOtp(email, code, newPin);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset PIN'
      };
    }
  },

  requestPasswordResetOtp: async (email) => {
    try {
      const response = await authAPI.requestPasswordResetOtp(email);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send password reset code'
      };
    }
  },

  resetPasswordWithOtp: async (email, code, newPassword) => {
    try {
      const response = await authAPI.resetPasswordWithOtp(email, code, newPassword);
      return { success: true, ...response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset password'
      };
    }
  },

  fetchUserProfile: async () => {
    try {
      const response = await authAPI.getMe();
      const user = response.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load profile'
      };
    }
  },

  fetchPreferences: async () => {
    try {
      const response = await authAPI.getPreferences();
      set({ preferences: response.data.preferences });
      return response.data.preferences;
    } catch (error) {
      return null;
    }
  },

  updatePreferences: async (payload) => {
    try {
      const response = await authAPI.updatePreferences(payload);
      const nextPreferences = response.data.preferences;
      set({ preferences: nextPreferences });

      const currentUser = get().user || {};
      const updatedUser = {
        ...currentUser,
        settings: nextPreferences
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });

      return { success: true, preferences: nextPreferences };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update preferences'
      };
    }
  },

  updateSecurityPreferences: async (payload) => {
    try {
      const response = await authAPI.updateSecurity(payload);
      const currentUser = get().user || {};
      const updatedUser = {
        ...currentUser,
        biometricEnabled:
          response.data.security?.biometricEnabled ?? currentUser.biometricEnabled,
        settings: {
          ...(currentUser.settings || {}),
          security: {
            ...(currentUser.settings?.security || {}),
            ...response.data.security
          }
        }
      };

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true, security: response.data.security };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update security settings'
      };
    }
  },

  clearError: () => set({ error: null }),

  reset: () => {
    set({
      user: null,
      token: null,
      preferences: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }
}));
