import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { p2pAPI } from '../../api/client';
import { p2pAmount, p2pMoney } from '../../lib/p2p';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function P2POrderDetailsScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initialOffer = route.params?.offer || null;
  const offerId = route.params?.offerId || initialOffer?.id || null;
  const [offer] = useState(initialOffer);
  const [order, setOrder] = useState(null);
  const [amount, setAmount] = useState(initialOffer?.minOrderAmount ? String(initialOffer.minOrderAmount) : '');
  const [proofNote, setProofNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [releaseNote, setReleaseNote] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeNote, setDisputeNote] = useState('');
  const [disputeUrl, setDisputeUrl] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOrder = async () => {
    if (!route.params?.orderId) return;
    try {
      const response = await p2pAPI.getOrder(route.params.orderId);
      setOrder(response.data.order);
    } catch (error) {
      console.log('Load P2P order error:', error);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [route.params?.orderId]);

  const createOrder = async () => {
    if (!offerId || !amount) {
      Alert.alert('Error', 'Enter a trade amount.');
      return;
    }

    setLoading(true);
    try {
      const response = await p2pAPI.createOrder(offerId, Number(amount));
      setOrder(response.data.order);
      Alert.alert('Order created', 'Crypto has been locked in escrow for this trade.');
    } catch (error) {
      Alert.alert('Create order failed', error.response?.data?.message || 'Unable to create order.');
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const response = await p2pAPI.markPaid(order.id, { proofNote, proofUrl });
      setOrder(response.data.order);
      Alert.alert('Payment sent', 'The seller has been notified to review and release escrow.');
    } catch (error) {
      Alert.alert('Update failed', error.response?.data?.message || 'Unable to mark this order as paid.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const response = await p2pAPI.confirmPayment(order.id, { releaseNote });
      setOrder(response.data.order);
      Alert.alert('Escrow released', 'The crypto has been delivered to the buyer.');
    } catch (error) {
      Alert.alert('Release failed', error.response?.data?.message || 'Unable to release escrow.');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const response = await p2pAPI.cancelOrder(order.id, { reason: releaseNote || undefined });
      setOrder(response.data.order);
      Alert.alert('Order cancelled', 'Escrow has been returned.');
    } catch (error) {
      Alert.alert('Cancel failed', error.response?.data?.message || 'Unable to cancel this order.');
    } finally {
      setLoading(false);
    }
  };

  const openDispute = async () => {
    if (!order || disputeReason.length < 10) {
      Alert.alert('Error', 'Add a clear dispute reason before submitting.');
      return;
    }
    setLoading(true);
    try {
      const response = await p2pAPI.openDispute(order.id, {
        reason: disputeReason,
        evidenceNote: disputeNote,
        evidenceUrl: disputeUrl
      });
      setOrder(response.data.order);
      Alert.alert('Dispute opened', 'This trade is now under review.');
    } catch (error) {
      Alert.alert('Dispute failed', error.response?.data?.message || 'Unable to open dispute.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!order?.dispute?.id || !chatMessage) return;
    setLoading(true);
    try {
      await p2pAPI.sendDisputeMessage(order.dispute.id, chatMessage);
      setChatMessage('');
      await loadOrder();
    } catch (error) {
      Alert.alert('Message failed', error.response?.data?.message || 'Unable to send dispute message.');
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (outcome) => {
    if (!order?.dispute?.id) return;
    setLoading(true);
    try {
      const response = await p2pAPI.resolveDispute(order.dispute.id, { outcome, note: resolutionNote });
      setOrder(response.data.order);
      Alert.alert('Dispute resolved', 'The escrow outcome has been applied.');
    } catch (error) {
      Alert.alert('Resolve failed', error.response?.data?.message || 'Unable to resolve dispute.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>P2P Order</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {offer && !order ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Offer details</Text>
            <Text style={styles.bodyText}>
              {offer.side === 'sell' ? 'Seller' : 'Buyer'} rate {p2pMoney(offer.price)}/{offer.asset}
            </Text>
            <Text style={styles.bodyText}>
              Range {p2pAmount(offer.minOrderAmount, 6)} - {p2pAmount(offer.maxOrderAmount, 6)} {offer.asset}
            </Text>
            <Text style={styles.bodyText}>Available {p2pAmount(offer.availableAmount, 6)} {offer.asset}</Text>
            {offer.isMine ? (
              <Text style={styles.bodyText}>This is your own listing. Other users can open it and trade against it.</Text>
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Crypto amount"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.primaryButton} onPress={createOrder} disabled={loading}>
                  <Text style={styles.primaryButtonText}>{loading ? 'Creating order...' : 'Lock escrow and continue'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}

        {order ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order {order.reference}</Text>
            <Text style={styles.bodyText}>{p2pAmount(order.cryptoAmount, 6)} {order.asset} • {p2pMoney(order.fiatAmount)}</Text>
            <Text style={styles.bodyText}>Status: {order.status.replace(/_/g, ' ')}</Text>
            <Text style={styles.bodyText}>Buyer: {order.buyer.fullName || order.buyer.username || 'Buyer'}</Text>
            <Text style={styles.bodyText}>Seller: {order.seller.fullName || order.seller.username || 'Seller'}</Text>
            {order.paymentSnapshot?.accountNumber ? (
              <View style={styles.snapshotBox}>
                <Text style={styles.snapshotTitle}>Seller payment details</Text>
                <Text style={styles.bodyText}>{order.paymentSnapshot.accountName}</Text>
                <Text style={styles.bodyText}>{order.paymentSnapshot.bankName}</Text>
                <Text style={styles.bodyText}>{order.paymentSnapshot.accountNumber}</Text>
                {order.paymentSnapshot.instructions ? <Text style={styles.bodyText}>{order.paymentSnapshot.instructions}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {order?.isBuyer && order.status === 'awaiting_payment' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Buyer action</Text>
            <TextInput style={styles.input} value={proofNote} onChangeText={setProofNote} placeholder="Payment note / reference" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={proofUrl} onChangeText={setProofUrl} placeholder="Proof URL (optional)" placeholderTextColor={colors.textMuted} />
            <TouchableOpacity style={styles.primaryButton} onPress={markPaid} disabled={loading}>
              <Text style={styles.primaryButtonText}>I have paid the seller</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {order?.isSeller && ['awaiting_payment', 'payment_sent'].includes(order.status) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Seller release</Text>
            <TextInput style={styles.input} value={releaseNote} onChangeText={setReleaseNote} placeholder="Release note (optional)" placeholderTextColor={colors.textMuted} />
            <TouchableOpacity style={styles.primaryButton} onPress={confirmPayment} disabled={loading}>
              <Text style={styles.primaryButtonText}>Confirm payment and release crypto</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {order && ['awaiting_payment', 'payment_sent'].includes(order.status) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Risk controls</Text>
            <TextInput style={styles.input} value={disputeReason} onChangeText={setDisputeReason} placeholder="Dispute reason if payment is contested" placeholderTextColor={colors.textMuted} multiline />
            <TextInput style={styles.input} value={disputeNote} onChangeText={setDisputeNote} placeholder="Evidence note" placeholderTextColor={colors.textMuted} />
            <TextInput style={styles.input} value={disputeUrl} onChangeText={setDisputeUrl} placeholder="Evidence URL" placeholderTextColor={colors.textMuted} />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={cancelOrder} disabled={loading}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={openDispute} disabled={loading}>
                <Text style={styles.dangerButtonText}>Open dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {order?.dispute ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dispute room</Text>
            <Text style={styles.bodyText}>{order.dispute.reason}</Text>
            {(order.dispute.messages || []).map((message, index) => (
              <View key={`${message.createdAt}-${index}`} style={styles.messageBubble}>
                <Text style={styles.messageLabel}>{message.senderLabel || 'Message'}</Text>
                <Text style={styles.bodyText}>{message.message}</Text>
              </View>
            ))}
            <TextInput style={styles.input} value={chatMessage} onChangeText={setChatMessage} placeholder="Send an update" placeholderTextColor={colors.textMuted} />
            <TouchableOpacity style={styles.secondaryButton} onPress={sendMessage} disabled={loading}>
              <Text style={styles.secondaryButtonText}>Send message</Text>
            </TouchableOpacity>

            {order.dispute.status === 'open' ? (
              <View>
                <TextInput style={styles.input} value={resolutionNote} onChangeText={setResolutionNote} placeholder="Admin resolution note" placeholderTextColor={colors.textMuted} />
                <TouchableOpacity style={styles.primaryButton} onPress={() => resolveDispute('release_to_buyer')} disabled={loading}>
                  <Text style={styles.primaryButtonText}>Admin: release to buyer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => resolveDispute('refund_to_seller')} disabled={loading}>
                  <Text style={styles.secondaryButtonText}>Admin: refund seller</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostButton} onPress={() => resolveDispute('dismissed')} disabled={loading}>
                  <Text style={styles.ghostButtonText}>Admin: dismiss dispute</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    placeholder: { width: 40 },
    scrollView: { flex: 1, padding: 16 },
    card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10 },
    bodyText: { color: colors.textMuted, marginBottom: 6, lineHeight: 20 },
    snapshotBox: { marginTop: 12, backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 12 },
    snapshotTitle: { color: colors.text, fontWeight: '700', marginBottom: 8 },
    input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 14, color: colors.text, paddingHorizontal: 14, paddingVertical: 12, marginTop: 10 },
    primaryButton: { marginTop: 14, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', paddingVertical: 13 },
    primaryButtonText: { color: colors.black, fontWeight: '700' },
    secondaryButton: { marginTop: 14, backgroundColor: colors.surfaceMuted, borderRadius: 14, alignItems: 'center', paddingVertical: 13, borderWidth: 1, borderColor: colors.border, flex: 1 },
    secondaryButtonText: { color: colors.text, fontWeight: '700' },
    dangerButton: { marginTop: 14, backgroundColor: colors.danger, borderRadius: 14, alignItems: 'center', paddingVertical: 13, flex: 1 },
    dangerButtonText: { color: colors.white, fontWeight: '700' },
    ghostButton: { marginTop: 14, borderRadius: 14, alignItems: 'center', paddingVertical: 13, borderWidth: 1, borderColor: colors.border },
    ghostButtonText: { color: colors.textMuted, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 10 },
    messageBubble: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceMuted },
    messageLabel: { color: colors.text, fontWeight: '700', marginBottom: 4 }
  });
