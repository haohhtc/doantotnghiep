import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../api/client';
import { isValidDateString } from '../../utils/date';
import { computeLine, taxRateOf } from '../../utils/pricing';

const today = () => new Date().toISOString().slice(0, 10);

// Buoc 1 "them san pham vao gio" (yeu cau tv2, giong anh tham khao "Danh sach hang hoa - Giao
// sau"): stepper +/- thay vi go tay so luong, gia tu dong tra ve theo bang gia. Buoc 2 (xem lai +
// xac nhan) o man hinh review.js, nhan gio hang qua route params.
export default function NewPreorder() {
  const { customerId: presetCustomerId } = useLocalSearchParams();
  const { session } = useSession();
  const employee = session?.employee;
  const branchId = employee?.user?.branch?.id;

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [mainWarehouseId, setMainWarehouseId] = useState(null);

  const [customerId, setCustomerId] = useState(presetCustomerId ? Number(presetCustomerId) : null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [quantities, setQuantities] = useState({});
  const [prices, setPrices] = useState({});

  const [error, setError] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!branchId) {
        setLoading(false);
        return;
      }
      try {
        const [customersRes, productsRes, warehousesRes] = await Promise.all([
          apiClient.get('/api/customers'),
          apiClient.get(`/api/branches/${branchId}/products`),
          apiClient.get('/api/warehouses'),
        ]);
        setCustomers(customersRes.data.data.filter((c) => c.branch?.id === branchId));
        setProducts(productsRes.data.data.map((a) => a.product));
        const main = warehousesRes.data.data.find(
          (w) => w.branch?.id === branchId && w.warehouseType === 'MAIN'
        );
        setMainWarehouseId(main?.id || null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [branchId]);

  async function lookupPrice(productId) {
    if (!customerId || !mainWarehouseId) return;
    try {
      const res = await apiClient.get('/api/price-lists/lookup', {
        params: { productId, customerId, warehouseId: mainWarehouseId, purpose: 'SALE', date: today() },
      });
      if (res.data.data != null) {
        setPrices((prev) => ({ ...prev, [productId]: res.data.data }));
      }
    } catch {
      // Khong tim duoc gia tu dong - de nguoi dung tu sua o man xem lai, khong chan.
    }
  }

  function changeQty(productId, delta) {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[productId] || 0) + delta);
      return { ...prev, [productId]: next };
    });
    if (!prices[productId]) lookupPrice(productId);
  }

  // uomId = don vi ban (saleUom) cua san pham - BAT BUOC gui kem, vi gia tra ve tu lookupPrice()
  // la gia theo saleUom (vd Hop), con so luong bam +/- cung la theo Hop. Thieu uomId thi backend
  // hieu nham so luong la don vi co so (goi) -> tong tien sai gap nhieu lan (xem dalam.md 2026-11-04).
  const cartLines = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === Number(productId));
      return {
        productId: Number(productId),
        name: product?.name,
        quantity: qty,
        unitPrice: prices[productId] || 0,
        uomId: product?.saleUom?.id || null,
        taxRatePercent: taxRateOf(product),
      };
    });
  const cartTotal = cartLines.reduce(
    (sum, l) => sum + computeLine(l.quantity, l.unitPrice, l.taxRatePercent).total,
    0
  );

  function handleGoToReview() {
    if (!customerId) {
      setError('Chọn khách hàng');
      return;
    }
    if (!deliveryDate) {
      setError('Đơn Pre-order bắt buộc có ngày giao hàng (YYYY-MM-DD)');
      return;
    }
    if (!isValidDateString(deliveryDate)) {
      setError('Ngày giao hàng không hợp lệ, đúng định dạng YYYY-MM-DD (ví dụ 2026-11-20)');
      return;
    }
    if (cartLines.length === 0) {
      setError('Chọn số lượng cho ít nhất 1 sản phẩm');
      return;
    }
    setError(null);
    router.push({
      pathname: '/preorder/review',
      params: {
        customerId: String(customerId),
        warehouseId: String(mainWarehouseId),
        deliveryDate,
        items: JSON.stringify(cartLines),
      },
    });
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const keyword = customerSearch.trim().toLowerCase();
  const filteredCustomers = keyword
    ? customers.filter((c) => (c.name || '').toLowerCase().includes(keyword))
    : customers;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Khách hàng</Text>
      {/* Doi tu render het ~480 khach hang cung luc (khong ao hoa, lam dung/giat may that - nguoi
          dung bao "bam vao day no bi dung khong luot duoc") sang 1 nut mo Modal rieng, FlatList
          AO HOA + co o tim kiem - man chinh (san pham) khong con bi lam nang nua. */}
      <Pressable style={styles.customerPickerBtn} onPress={() => setCustomerModalOpen(true)}>
        <Text style={selectedCustomer ? styles.customerPickerText : styles.customerPickerPlaceholder}>
          {selectedCustomer ? selectedCustomer.name : 'Chọn khách hàng'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#666" />
      </Pressable>

      <Modal visible={customerModalOpen} animationType="slide" onRequestClose={() => setCustomerModalOpen(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn khách hàng</Text>
            <Pressable onPress={() => setCustomerModalOpen(false)}>
              <Ionicons name="close" size={24} color="#444" />
            </Pressable>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên khách hàng..."
            value={customerSearch}
            onChangeText={setCustomerSearch}
            autoFocus
          />
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy khách hàng.</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.customerRow, customerId === item.id && styles.customerRowActive]}
                onPress={() => {
                  setCustomerId(item.id);
                  setCustomerModalOpen(false);
                  setCustomerSearch('');
                }}
              >
                <Text style={[styles.customerRowText, customerId === item.id && styles.customerRowTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>

      <Text style={styles.label}>Ngày giao hàng (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2026-10-20"
        value={deliveryDate}
        onChangeText={setDeliveryDate}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Sản phẩm</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const qty = quantities[item.id] || 0;
          return (
            <View style={styles.row}>
              <Text style={styles.rowName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => changeQty(item.id, -1)}>
                  <Text style={styles.stepBtnText}>−</Text>
                </Pressable>
                <Text style={[styles.stepValue, qty > 0 && styles.stepValueActive]}>{qty}</Text>
                <Pressable style={styles.stepBtn} onPress={() => changeQty(item.id, 1)}>
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {cartLines.length > 0 ? (
        <Pressable style={styles.cartBar} onPress={handleGoToReview}>
          <Text style={styles.cartBarText}>Giỏ hàng: {cartLines.length} sản phẩm</Text>
          <Text style={styles.cartBarText}>{cartTotal.toLocaleString('vi-VN')} đ →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 4 },
  customerPickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8,
  },
  customerPickerText: { fontSize: 14, color: '#111', fontWeight: '600' },
  customerPickerPlaceholder: { fontSize: 14, color: '#999' },
  modalContainer: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  customerRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  customerRowActive: { backgroundColor: '#e6f4ff' },
  customerRowText: { fontSize: 14, color: '#111' },
  customerRowTextActive: { fontWeight: '700', color: '#1677ff' },
  empty: { color: '#999', marginTop: 24, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 13, marginRight: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: '#1677ff' },
  stepValue: { width: 36, textAlign: 'center', fontSize: 15 },
  stepValueActive: { fontWeight: '700', color: '#1677ff' },
  cartBar: {
    position: 'absolute', left: 16, right: 16, bottom: 16,
    backgroundColor: '#1677ff', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  cartBarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  error: { color: '#d4380d', marginVertical: 4, textAlign: 'center' },
});
