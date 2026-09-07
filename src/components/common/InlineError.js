import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InlineError({ message, onRetry }) {
  if (!message) return null;

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3B1118',
    borderColor: '#EF4444',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12
  },
  message: { color: '#FECACA', fontSize: 14, lineHeight: 20 },
  retryButton: { alignSelf: 'flex-start', marginTop: 8 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }
});