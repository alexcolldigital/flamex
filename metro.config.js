const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Silence @noble/hashes ./crypto.js subpath export warnings
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@noble/hashes/crypto.js' || moduleName === '@noble/hashes/crypto') {
    // Prefer the ethers-local copy if resolving from within ethers
    const fromEthers = context.originModulePath?.includes('node_modules/ethers');
    const base = fromEthers
      ? path.resolve(__dirname, 'node_modules/ethers/node_modules/@noble/hashes/crypto.js')
      : path.resolve(__dirname, 'node_modules/@noble/hashes/crypto.js');
    return { filePath: base, type: 'sourceFile' };
  }
  return resolveRequest
    ? resolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

// Add support for crypto polyfills
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
  process: require.resolve('process/browser'),
  util: require.resolve('util'),
  url: require.resolve('url'),
  querystring: require.resolve('querystring-es3'),
  zlib: require.resolve('browserify-zlib'),
  assert: require.resolve('assert'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify'),
  path: require.resolve('path-browserify'),
  // Removed problematic native modules that don't work on web:
  // fs: require.resolve('react-native-level-fs'),
  // net: require.resolve('react-native-tcp'),
  // tls: require.resolve('react-native-tcp'),
  // dns: require.resolve('dns.js'),
  // dgram: require.resolve('react-native-udp'),
};

// Add asset extensions
config.resolver.assetExts.push('cjs');

module.exports = config;
