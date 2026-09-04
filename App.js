import './shim';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { useWalletStore } from './src/store/walletStore';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';

const linking = {
  prefixes: ['/', 'flamex://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: '',
          Login: 'login',
          CreateWallet: 'create-wallet'
        }
      },
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Home: 'home',
              Wallet: 'wallet',
              Swap: 'swap',
              Referral: 'referral',
              Settings: 'settings'
            }
          },
          Deposit: 'deposit',
          Withdraw: 'withdraw',
          Transfer: 'transfer',
          ProfileDetails: 'settings/profile',
          Kyc: 'settings/kyc',
          Preferences: 'settings/preferences',
          NotificationSettings: 'settings/notifications',
          InfoDetails: 'settings/info',
          KeyManagement: 'settings/keys',
          UsernameSettings: 'settings/username',
          SecuritySettings: 'settings/security',
          TransactionDetails: 'wallet/transaction',
          Notifications: 'notifications',
          Bills: 'bills',
          Airtime: 'bills/airtime',
          Data: 'bills/data',
          Electricity: 'bills/electricity',
          Cable: 'bills/cable',
          GiftCards: 'bills/gift-cards',
          P2P: 'p2p',
          P2PCreateOffer: 'p2p/create-offer',
          P2POrderDetails: 'p2p/order'
        }
      }
    }
  }
};

// Loading Screen Component
function LoadingScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// Main App Component
function AppContent() {
  const { isAuthenticated, user, isLoading: authLoading, initializeAuth } = useAuthStore();
  const { initializeWallets } = useWalletStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated) {
          await initializeWallets();
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  if (isInitializing || authLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      linking={linking}
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.danger
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' }
        }
      }}
    >
      <AppNavigator isAuthenticated={isAuthenticated} user={user} />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.minHeight = '100%';

    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
      document.body.style.minHeight = '';
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { colors, isDark } = useAppTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
