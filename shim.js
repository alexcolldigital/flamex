import { Platform } from 'react-native';

// react-native-get-random-values patches crypto.getRandomValues on native only
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

import 'react-native-url-polyfill/auto';

// Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Process polyfill
import process from 'process';
global.process = process;

// Crypto polyfill — native only; web already has window.crypto with getRandomValues
if (Platform.OS !== 'web') {
  global.crypto = require('crypto-browserify');
}

// TextEncoder/TextDecoder polyfill
import { TextEncoder, TextDecoder } from 'text-encoding';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// BigInt polyfill for older environments
if (typeof BigInt === 'undefined') {
  global.BigInt = require('big-integer');
}
