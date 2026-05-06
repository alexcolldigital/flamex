import './shim';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { useWalletStore } from './src/store/walletStore';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';

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
  const { isAuthenticated, isLoading: authLoading, initializeAuth } = useAuthStore();
  const { initializeWallets, isLoading: walletLoading } = useWalletStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize auth state
        await initializeAuth();
        
        // If authenticated, initialize wallets
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

  if (isInitializing || authLoading || walletLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
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
      <AppNavigator isAuthenticated={isAuthenticated} />
    </NavigationContainer>
  );
}

export default function App() {
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
