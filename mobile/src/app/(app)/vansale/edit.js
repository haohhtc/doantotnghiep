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
} from 'react-native';
import { useSession } from '../../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../../api/client';

// Sua don Van Sale dang PENDING (API update chi cho sua khi con PENDING).
export default function EditVanSale() {
  const { id } = useLocalSearchParams();
  const { session } = useSession();
  const employee = session?.employee;
  const branchId = employee?.user?.branch?.id;

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);

  const [customerId, setCustomerId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [quantities, setQuantities] = useState({});
  const [prices, setPrices] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
    const details = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({
        productId: Number(productId),
        quantity: qty,
        unitPrice: Number(prices[productId] || 0),
      }));
    if (details.length === 0) {
      setError('Chọn số lượng cho ít nhất 1 sản phẩm');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/api/sales-orders/${id}`, {
        docDate: new Date().toISOString().slice(0, 10),
        customerId,
        warehouseId,
        orderType: 'STANDARD',
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Khách hàng</Text>
      <FlatList
        data={customers}
        horizontal
        keyExtractor={(item) => String(item.id)}
        style={{ marginBottom: 8, flexGrow: 0 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, customerId === item.id && styles.chipActive]}
            onPress={() => setCustomerId(item.id)}
          >
            <Text style={[styles.chipText, customerId === item.id && styles.chipTextActive]}>{item.name}</Text>
          </Pressable>
        )}
      />

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
  chip: { borderWidth: 1, borderColor: '#1677ff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive: { backgroundColor: '#1677ff' },
  chipText: { color: '#1677ff' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 13, marginRight: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: '#1677ff' },
  stepValue: { width: 36, textAlign: 'center', fontSize: 15 },
  stepValueActive: { fontWeight: '700', color: '#1677ff' },
  submitBtn: { backgroundColor: '#d4380d', borderRadius: 8, padding: 14, alignItems: 'center', marginVertical: 16 },
  submitText: { color: '#fff', fontWeight: '700' },
  error: { color: '#d4380d', marginVertical: 4, textAlign: 'center' },
});
