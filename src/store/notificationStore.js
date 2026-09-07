import { create } from 'zustand';
import { notificationAPI } from '../api/client';

const normalizeNotification = (notification) => ({
  ...notification,
  id: notification.id || notification._id,
  createdAt: notification.createdAt || new Date().toISOString(),
  read: Boolean(notification.read),
  data: notification.data || {}
});

export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pushToken: null,

  // Actions
  initializeNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationAPI.getAll();
      const notifications = (response.data.notifications || []).map(normalizeNotification);
      set({
        notifications,
        unreadCount: response.data.unreadCount || 0,
        isLoading: false
      });
    } catch (error) {
      console.error('Initialize notifications error:', error);
      set({ isLoading: false });
    }
  },

  addNotification: async (notification) => {
    const { notifications } = get();
    const newNotification = normalizeNotification({
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
      ...notification
    });
    const updated = [newNotification, ...notifications].slice(0, 100); // Keep last 100
    const newUnreadCount = updated.filter(n => !n.read).length;

    set({
      notifications: updated,
      unreadCount: newUnreadCount
    });

    return newNotification;
  },

  markAsRead: async (id) => {
    const { notifications } = get();
    try {
      await notificationAPI.markRead(id);
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return false;
    }
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    const newUnreadCount = updated.filter(n => !n.read).length;

    set({
      notifications: updated,
      unreadCount: newUnreadCount
    });
    return true;
  },

  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllRead();
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return false;
    }
    const { notifications } = get();
    const updated = notifications.map(n => ({ ...n, read: true }));

    set({
      notifications: updated,
      unreadCount: 0
    });
    return true;
  },

  deleteNotification: async (id) => {
    try {
      await notificationAPI.deleteOne(id);
    } catch (error) {
      console.error('Delete notification error:', error);
      return false;
    }
    const { notifications } = get();
    const updated = notifications.filter(n => n.id !== id);
    const newUnreadCount = updated.filter(n => !n.read).length;

    set({
      notifications: updated,
      unreadCount: newUnreadCount
    });
    return true;
  },

  clearAll: async () => {
    try {
      await notificationAPI.clearAll();
    } catch (error) {
      console.error('Clear notifications error:', error);
      return false;
    }
    set({ notifications: [], unreadCount: 0 });
    return true;
  },

  setPushToken: (token) => {
    set({ pushToken: token });
  },

  // Simulate receiving a push notification
  simulateNotification: (type, data) => {
    const templates = {
      transaction: {
        title: 'Transaction Confirmed',
        body: `Your transaction of ${data.amount} ${data.symbol} has been confirmed`,
        type: 'transaction',
        data,
      },
      receive: {
        title: 'Payment Received',
        body: `You received ${data.amount} ${data.symbol} from @${data.from}`,
        type: 'receive',
        data,
      },
      referral: {
        title: 'Referral Reward',
        body: `You earned $${data.amount} from your referral`,
        type: 'referral',
        data,
      },
      price_alert: {
        title: 'Price Alert',
        body: `${data.symbol} is up ${data.change}% in the last 24h`,
        type: 'price_alert',
        data,
      },
      security: {
        title: 'Security Alert',
        body: 'New login detected from a new device',
        type: 'security',
        data,
      },
    };

    const template = templates[type];
    if (template) {
      get().addNotification(template);
    }
  },

  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.read);
  },

  getNotificationsByType: (type) => {
    return get().notifications.filter(n => n.type === type);
  },
}));
