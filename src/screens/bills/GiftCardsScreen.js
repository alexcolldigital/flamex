import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { billsAPI } from '../../api/client';
import BillPinModal from '../../components/BillPinModal';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function GiftCardsScreen({ navigation }) {
  const { user, fetchUserProfile } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categories, setCategories] = useState([]);
  const [denominations, setDenominations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDenomination, setSelectedDenomination] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [purchasedCards, setPurchasedCards] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    billsAPI
      .getProviders('giftcards')
      .then((response) => {
        setCategories(response.data.providers?.categories || []);
        setDenominations(response.data.providers?.denominations || []);
      })
      .catch(() => {
        setCategories([]);
        setDenominations([]);
      });
  }, []);

  const calculateTotal = () => {
    if (!selectedDenomination || !quantity) return 0;
    const subtotal = Number(selectedDenomination) * Number(quantity || 0);
    const feeAmount = subtotal * 0.05;
    return subtotal + feeAmount;
  };

  const total = calculateTotal();
  const selectedCategoryItem = categories.find((item) => item.id === selectedCategory);

  const openPinModal = () => {
    const parsedQuantity = Number(quantity);
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a gift card category');
      return;
    }
    if (!selectedDenomination) {
      Alert.alert('Error', 'Please select a denomination');
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
      Alert.alert('Error', 'Quantity must be between 1 and 10');
      return;
    }
    setShowPinModal(true);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const response = await billsAPI.buyGiftCard({
        category: selectedCategory,
        denomination: Number(selectedDenomination),
        quantity: Number(quantity),
        pin
      });
      await fetchUserProfile();
      setPurchasedCards(response.data.details?.codes || []);
      setShowPinModal(false);
      setPin('');
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Purchase failed', error.response?.data?.message || 'Unable to buy gift card.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Cards</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceValue}>N{Number(user?.balances?.NGN || 0).toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionLabel}>Select Gift Card</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, selectedCategory === cat.id && { borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="gift-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.categoryName, selectedCategory === cat.id && { color: colors.primary }]} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCategoryItem ? (
          <View style={styles.selectedCategoryCard}>
            <View style={[styles.selectedIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="gift-outline" size={32} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.selectedName}>{selectedCategoryItem.name}</Text>
              <Text style={styles.selectedRate}>Backend total includes 5% fee</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Select Denomination ($)</Text>
        <View style={styles.denominationsRow}>
          {denominations.map((denom) => (
            <TouchableOpacity
              key={denom}
              style={[styles.denomBtn, selectedDenomination === denom && styles.denomBtnActive]}
              onPress={() => setSelectedDenomination(denom)}
            >
              <Text style={[styles.denomText, selectedDenomination === denom && styles.denomTextActive]}>${denom}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() => setQuantity(Math.max(1, Number(quantity || 1) - 1).toString())}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.quantityInput}
            value={quantity}
            onChangeText={(value) => setQuantity(value.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            textAlign="center"
          />
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() => setQuantity((Number(quantity || 0) + 1).toString())}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {selectedDenomination ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gift Card</Text>
              <Text style={styles.summaryValue}>{selectedCategoryItem?.name} ${selectedDenomination}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Quantity</Text>
              <Text style={styles.summaryValue}>{quantity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated total</Text>
              <Text style={styles.summaryValue}>N{total.toLocaleString()}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.purchaseBtn,
            (!selectedCategory || !selectedDenomination || Number(quantity) < 1) && styles.purchaseBtnDisabled
          ]}
          onPress={openPinModal}
          disabled={!selectedCategory || !selectedDenomination || Number(quantity) < 1}
        >
          <Text style={styles.purchaseBtnText}>
            {total > 0 ? `Pay N${total.toLocaleString()}` : 'Complete Order'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BillPinModal
        visible={showPinModal}
        pin={pin}
        setPin={setPin}
        loading={isLoading}
        onConfirm={handlePurchase}
        onClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
        subtitle="Authorize your gift card purchase"
      />

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color={colors.black} />
            </View>
            <Text style={styles.modalTitle}>Purchase Successful</Text>
            <Text style={styles.modalText}>Your gift card codes are available below.</Text>

            <View style={styles.codesContainer}>
              {purchasedCards.map((card, index) => (
                <View key={index} style={styles.codeCard}>
                  <Text style={styles.codeLabel}>Card {index + 1}</Text>
                  <Text style={styles.codeValue}>{card.code}</Text>
                  <Text style={styles.codePin}>PIN: {card.pin}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    placeholder: { width: 40 },
    scrollView: { flex: 1, padding: 16 },
    balanceCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    balanceLabel: { color: colors.textMuted },
    balanceValue: { color: colors.success, fontSize: 24, fontWeight: '700', marginTop: 6 },
    sectionLabel: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 12 },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    categoryCard: { width: '18%', backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    categoryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    categoryName: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
    selectedCategoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    selectedIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    selectedName: { fontSize: 18, fontWeight: '600', color: colors.text },
    selectedRate: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    denominationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    denomBtn: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    denomBtnActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
    denomText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
    denomTextActive: { color: colors.primary },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
    quantityBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    quantityInput: { width: 80, height: 50, backgroundColor: colors.surface, borderRadius: 8, color: colors.text, fontSize: 20, fontWeight: '600', borderWidth: 1, borderColor: colors.border },
    summaryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    summaryTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    summaryLabel: { fontSize: 13, color: colors.textMuted },
    summaryValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
    purchaseBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
    purchaseBtnDisabled: { opacity: 0.6 },
    purchaseBtnText: { color: colors.black, fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    modalText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 16 },
    codesContainer: { width: '100%', marginBottom: 20, maxHeight: 280 },
    codeCard: { backgroundColor: colors.input, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    codeLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
    codeValue: { fontSize: 16, fontWeight: '600', color: colors.primary, letterSpacing: 2, marginBottom: 8 },
    codePin: { fontSize: 14, color: colors.text },
    modalBtn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
    modalBtnText: { color: colors.black, fontSize: 16, fontWeight: '700' }
  });
