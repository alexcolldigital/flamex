import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  style = {},
  textStyle = {},
}) {
  const sizeStyle = size === 'small'
    ? { paddingVertical: 8, paddingHorizontal: 16 }
    : size === 'large'
    ? { paddingVertical: 18, paddingHorizontal: 32 }
    : { paddingVertical: 14, paddingHorizontal: 24 };

  const variantStyle = {
    primary:   { backgroundColor: '#22C55E' },
    secondary: { backgroundColor: '#1E293B' },
    outline:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#22C55E' },
    danger:    { backgroundColor: '#EF4444' },
  }[variant] || { backgroundColor: '#22C55E' };

  const textColor = {
    primary:   '#080B12',
    secondary: '#FFFFFF',
    outline:   '#22C55E',
    danger:    '#FFFFFF',
  }[variant] || '#080B12';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.base, sizeStyle, variantStyle, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.45,
  },
});
