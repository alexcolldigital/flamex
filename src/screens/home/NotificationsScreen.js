import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/notificationStore';
import { useAppTheme } from '../../theme/ThemeProvider';

const NOTIFICATION_ICONS = {
  transaction: { icon: 'swap-horizontal-outline', color: '#f59e0b' },
  receive: { icon: 'arrow-down-outline', color: '#22c55e' },
  send: { icon: 'arrow-up-outline', color: '#ef4444' },
  bill: { icon: 'receipt-outline', color: '#14b8a6' },
  p2p: { icon: 'people-circle-outline', color: '#6366f1' },
  referral: { icon: 'people-outline', color: '#8b5cf6' },
  price_alert: { icon: 'trending-up-outline', color: '#3b82f6' },
  security: { icon: 'shield-outline', color: '#ef4444' },
  system: { icon: 'information-circle-outline', color: '#666' },
};

export default function NotificationsScreen({ navigation }) {
  const { colors } = useAppTheme();
  const {
    notifications,
    unreadCount,
    initializeNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await initializeNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkAllRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: markAllAsRead },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(id) },
      ]
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = (notification) => {
    const iconConfig = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;
    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, { backgroundColor: colors.surface }, !notification.read && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}
        onPress={() => markAsRead(notification.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}20` }]}>
          <Ionicons name={iconConfig.icon} size={22} color={iconConfig.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.title, { color: colors.text }]}>{notification.title}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(notification.createdAt)}</Text>
          </View>
          <Text style={[styles.body, { color: colors.textMuted }]} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        {!notification.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(notification.id)}>
          <Ionicons name="close-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <>
              <TouchableOpacity onPress={handleMarkAllRead} style={[styles.actionButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearAll} style={[styles.actionButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              You don't have any notifications yet.{'\n'}They'll appear here when you do.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotification)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  notificationsList: { padding: 16 },
  notificationCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1, marginLeft: 12, marginRight: 8 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', flex: 1 },
  time: { fontSize: 12 },
  body: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  deleteButton: { padding: 4 },
});
