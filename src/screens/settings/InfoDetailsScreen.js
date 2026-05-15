import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';

const CONTENT = {
  help: {
    title: 'Help Center',
    body: [
      'Use Deposit to fund your NGN balance and Wallet to view your on-chain addresses.',
      'Transfers to usernames stay inside FlameX. Transfers to wallet addresses are processed as on-chain withdrawals.',
      'Bill payments, gift cards, and fiat withdrawals require your transaction PIN for security.'
    ]
  },
  contact: {
    title: 'Contact Us',
    body: [
      'Email: support@flamex.app',
      'Phone: +234 700 000 0000',
      'Support hours: Monday to Saturday, 8:00 AM to 6:00 PM WAT'
    ]
  },
  about: {
    title: 'About FlameX',
    body: [
      'FlameX is a non-custodial wallet experience for crypto, fiat, swaps, referrals, and utility payments.',
      'Version: 1.0.0',
      'Security stack: JWT auth, PIN-protected actions, optional biometric preference, and KYC support.'
    ]
  }
};

export default function InfoDetailsScreen({ navigation, route }) {
  const type = route?.params?.type || 'about';
  const info = CONTENT[type] || CONTENT.about;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{info.title}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {info.body.map((item) => (
          <View key={item} style={styles.card}>
            <Text style={styles.bodyText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingHorizontal: 16,
      paddingBottom: 16
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text
    },
    placeholder: {
      width: 40
    },
    scrollView: {
      flex: 1
    },
    content: {
      flexGrow: 1,
      padding: 16,
      gap: 12,
      paddingBottom: 120
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.text
    }
  });
