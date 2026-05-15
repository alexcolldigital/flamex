import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { ThemeProvider, useAppTheme } from '../../theme/ThemeProvider';

const THEME_OPTIONS = ['system', 'light', 'dark'];
const CURRENCY_OPTIONS = ['NGN', 'USD'];
const LANGUAGE_OPTIONS = ['en'];

export default function PreferencesScreen({ navigation }) {
  const { user, updatePreferences } = useAuthStore();
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currency, setCurrency] = useState(user?.settings?.currency || 'NGN');
  const [language, setLanguage] = useState(user?.settings?.language || 'en');

  const savePreferences = async (nextPayload) => {
    const result = await updatePreferences(nextPayload);
    if (!result.success) {
      Alert.alert('Save failed', result.error);
    }
  };

  const handleThemeChange = async (nextMode) => {
    await setThemeMode(nextMode);
    await savePreferences({ themeMode: nextMode });
  };

  const handleCurrencyChange = async (nextCurrency) => {
    setCurrency(nextCurrency);
    await savePreferences({ currency: nextCurrency });
  };

  const handleLanguageChange = async (nextLanguage) => {
    setLanguage(nextLanguage);
    await savePreferences({ language: nextLanguage });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {THEME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, themeMode === option && styles.optionActive]}
              onPress={() => handleThemeChange(option)}
            >
              <Text style={[styles.optionText, themeMode === option && styles.optionTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
              {themeMode === option ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Display Currency</Text>
          {CURRENCY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, currency === option && styles.optionActive]}
              onPress={() => handleCurrencyChange(option)}
            >
              <Text style={[styles.optionText, currency === option && styles.optionTextActive]}>
                {option}
              </Text>
              {currency === option ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Language</Text>
          {LANGUAGE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, language === option && styles.optionActive]}
              onPress={() => handleLanguageChange(option)}
            >
              <Text style={[styles.optionText, language === option && styles.optionTextActive]}>
                {option.toUpperCase()}
              </Text>
              {language === option ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
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
      gap: 16,
      paddingBottom: 120
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 10
    },
    optionActive: {
      borderColor: colors.primary
    },
    optionText: {
      color: colors.text,
      fontSize: 15
    },
    optionTextActive: {
      fontWeight: '700'
    }
  });
