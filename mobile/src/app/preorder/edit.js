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

// Sua don Pre-order dang PENDING (API update chi cho sua khi con PENDING - xem
// SalesOrderService.requirePending()). Nap san du lieu cu, gui PUT thay vi POST.
export default function EditPreorder() {
  const { id } = useLocalSearchParams();
  const { session } = useSession();
  const employee = session?.employee;
  const branchId = employee?.user?.branch?.id;

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);

  const [customerId, setCustomerId] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [quantities, setQuantities] = useState({});
  const [prices, setPrices] = useState({});
  const [submitting, setSubmitting] = useState(false);
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
        const [orderRes, customersRes, productsRes] = await Promise.all([
          apiClient.get(`/api/sales-orders/${id}`),
          apiClient.get('/api/customers'),
          apiClient.get(`/api/branches/${branchId}/products`),
        ]);
        const order = orderRes.data.data;
        setCustomerId(order.customer.id);
        setDeliveryDate(order.deliveryDate || '');
        setRemarks(order.remarks || '');
        setWarehouseId(order.warehouse.id);
        const qty = {};
        const price = {};
        order.details.forEach((d) => {
          qty[d.product.id] = d.quantity;
          price[d.product.id] = d.unitPrice;
        });
        setQuantities(qty);
        setPrices(price);

        setCustomers(customersRes.data.data.filter((c) => c.branch?.id === branchId));
        setProducts(productsRes.data.data.map((a) => a.product));
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, branchId]);

  function changeQty(productId, delta) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) + delta) }));
  }

  async function handleSubmit() {
    if (!customerId) {
      setError('Chọn khách hàng');
      return;
    }
    if (!deliveryDate) {
      setError('Đơn Pre-order bắt buộc có ngày giao hàng');
      return;
    }
    if (!isValidDateString(deliveryDate)) {
      setError('Ngày giao hàng không hợp lệ, đúng định dạng YYYY-MM-DD (ví dụ 2026-11-20)');
      return;
    }
    // uomId = don vi ban (saleUom) cua san pham - BAT BUOC gui kem, cung ly do nhu man new.js
    // (gia la theo saleUom, thieu uomId backend hieu nham so luong la don vi co so).
    const details = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === Number(productId));
        return {
          productId: Number(productId),
          quantity: qty,
          unitPrice: Number(prices[productId] || 0),
          uomId: product?.saleUom?.id || null,
        };
      });
    if (details.length === 0) {
      setError('Chọn số lượng cho ít nhất 1 sản phẩm');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/api/sales-orders/${id}`, {
        docDate: new Date().toISOString().slice(0, 10),
        deliveryDate,
        customerId,
        warehouseId,
        orderType: 'PRE_ORDER',
        salesmanId: employee.id,
        remarks: remarks || null,
        details,
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
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
      <TextInput style={styles.input} value={deliveryDate} onChangeText={setDeliveryDate} />

      <Text style={styles.label}>Ghi chú đơn hàng</Text>
      <TextInput style={styles.input} value={remarks} onChangeText={setRemarks} />

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

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Lưu thay đổi</Text>}
      </Pressable>
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
  submitBtn: { backgroundColor: '#1677ff', borderRadius: 8, padding: 14, alignItems: 'center', marginVertical: 16 },
  submitText: { color: '#fff', fontWeight: '700' },
  error: { color: '#d4380d', marginVertical: 4, textAlign: 'center' },
});
