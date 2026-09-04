import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import CreateWalletScreen from '../screens/auth/CreateWalletScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import SwapScreen from '../screens/swap/SwapScreen';
import ReferralScreen from '../screens/referral/ReferralScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Feature Screens
import DepositScreen from '../screens/fiat/DepositScreen';
import WithdrawScreen from '../screens/fiat/WithdrawScreen';
import TransferScreen from '../screens/transfer/TransferScreen';

// Settings Screens
import KeyManagementScreen from '../screens/settings/KeyManagementScreen';
import UsernameSettingsScreen from '../screens/settings/UsernameSettingsScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';
import ProfileDetailsScreen from '../screens/settings/ProfileDetailsScreen';
import PreferencesScreen from '../screens/settings/PreferencesScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import InfoDetailsScreen from '../screens/settings/InfoDetailsScreen';
import KycScreen from '../screens/KycScreen';

// Additional Screens
import TransactionDetailsScreen from '../screens/wallet/TransactionDetailsScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';

// Bills Screens
import BillsScreen from '../screens/bills/BillsScreen';
import AirtimeScreen from '../screens/bills/AirtimeScreen';
import DataScreen from '../screens/bills/DataScreen';
import ElectricityScreen from '../screens/bills/ElectricityScreen';
import CableScreen from '../screens/bills/CableScreen';
import GiftCardsScreen from '../screens/bills/GiftCardsScreen';
import P2PScreen from '../screens/p2p/P2PScreen';
import P2PCreateOfferScreen from '../screens/p2p/P2PCreateOfferScreen';
import P2POrderDetailsScreen from '../screens/p2p/P2POrderDetailsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
    </Stack.Navigator>
  );
};

const MainTabNavigator = () => {
  const { colors, isDark } = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 70
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted
      }}
    >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Wallet"
      component={WalletScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Swap"
      component={SwapScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <View style={{
            backgroundColor: colors.primary,
            borderRadius: 30,
            padding: 12,
            marginTop: -20
          }}>
            <Ionicons name="swap-horizontal" size={28} color={isDark ? colors.black : colors.white} />
          </View>
        ),
        tabBarLabel: () => null
      }}
    />
    <Tab.Screen
      name="Referral"
      component={ReferralScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }}
    />
    </Tab.Navigator>
  );
};

const MainStackNavigator = () => {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Deposit" component={DepositScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <Stack.Screen name="Kyc" component={KycScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="InfoDetails" component={InfoDetailsScreen} />
      <Stack.Screen name="KeyManagement" component={KeyManagementScreen} />
      <Stack.Screen name="UsernameSettings" component={UsernameSettingsScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Bills" component={BillsScreen} />
      <Stack.Screen name="Airtime" component={AirtimeScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
      <Stack.Screen name="Electricity" component={ElectricityScreen} />
      <Stack.Screen name="Cable" component={CableScreen} />
      <Stack.Screen name="GiftCards" component={GiftCardsScreen} />
      <Stack.Screen name="P2P" component={P2PScreen} />
      <Stack.Screen name="P2PCreateOffer" component={P2PCreateOfferScreen} />
      <Stack.Screen name="P2POrderDetails" component={P2POrderDetailsScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = ({ isAuthenticated }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainStackNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
