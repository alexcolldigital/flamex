import { currencyFormatter } from './finance';

export const BILL_ICON_MAP = {
  airtime: { icon: 'call-outline', color: '#22c55e', label: 'Airtime' },
  data: { icon: 'wifi-outline', color: '#3b82f6', label: 'Data' },
  electricity: { icon: 'flash-outline', color: '#f59e0b', label: 'Electricity' },
  cable: { icon: 'tv-outline', color: '#8b5cf6', label: 'Cable TV' },
  giftcard: { icon: 'gift-outline', color: '#ec4899', label: 'Gift Card' }
};

export const BILL_CATEGORIES = [
  {
    id: 'airtime',
    name: 'Airtime',
    description: 'Buy airtime for any network',
    icon: 'call-outline',
    color: '#22c55e',
    route: 'Airtime'
  },
  {
    id: 'data',
    name: 'Data Bundle',
    description: 'Purchase data plans',
    icon: 'wifi-outline',
    color: '#3b82f6',
    route: 'Data'
  },
  {
    id: 'electricity',
    name: 'Electricity',
    description: 'Pay electricity bills',
    icon: 'flash-outline',
    color: '#f59e0b',
    route: 'Electricity'
  },
  {
    id: 'cable',
    name: 'Cable TV',
    description: 'DStv, GOtv, StarTimes',
    icon: 'tv-outline',
    color: '#8b5cf6',
    route: 'Cable'
  },
  {
    id: 'giftcard',
    name: 'Sell Gift Card',
    description: 'Submit cards for manual review',
    icon: 'gift-outline',
    color: '#ec4899',
    route: 'GiftCards'
  }
];

export const cleanPhoneNumber = (value) => value.replace(/\D/g, '').slice(0, 11);

export const formatPhoneNumber = (value) => {
  const cleaned = cleanPhoneNumber(value);
  if (!cleaned) return '';
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
};

export const titleForBillTransaction = (transaction) => {
  if (transaction.description) return transaction.description;
  return BILL_ICON_MAP[transaction.type]?.label || 'Bill payment';
};

export const amountForBillTransaction = (transaction) =>
  currencyFormatter(transaction.amount || 0);
