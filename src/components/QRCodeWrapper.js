import React from 'react';
import { Platform, View, Text } from 'react-native';

let QRCode = null;

// Only import react-native-qrcode-svg on native platforms
if (Platform.OS !== 'web') {
  QRCode = require('react-native-qrcode-svg').default;
}

// Web-compatible QR Code component wrapper
export default function QRCodeWrapper(props) {
  if (Platform.OS === 'web') {
    // For web, show a text-based representation of the QR code value
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
        <Text style={{ color: '#999', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
          QR Code
        </Text>
        <Text style={{ color: '#666', fontSize: 11, textAlign: 'center', fontFamily: 'monospace', marginVertical: 10, maxWidth: '90%' }}>
          {props.value || 'N/A'}
        </Text>
      </View>
    );
  }

  // On native platforms, use react-native-qrcode-svg
  if (!QRCode) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#999', fontSize: 12 }}>QR Code unavailable</Text>
      </View>
    );
  }
  
  return <QRCode {...props} />;
}
