export const P2P_ASSETS = ['USDT', 'USDC', 'SOL', 'ETH', 'BNB', 'FLAME'];

export const P2P_SIDE_META = {
  sell: {
    title: 'Sell Crypto',
    subtitle: 'You receive NGN after the buyer pays and you release escrow.',
    accent: '#ef4444'
  },
  buy: {
    title: 'Buy Crypto',
    subtitle: 'You pay NGN to a seller and receive crypto after release.',
    accent: '#16a34a'
  }
};

export const p2pAmount = (value, digits = 2) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });

export const p2pMoney = (value) => `N${p2pAmount(value, 2)}`;
