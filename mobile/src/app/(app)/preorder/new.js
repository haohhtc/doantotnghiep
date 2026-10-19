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

  const cartLines = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === Number(productId));
      return { productId: Number(productId), name: product?.name, quantity: qty, unitPrice: prices[productId] || 0 };
    });
  const cartTotal = cartLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  function handleGoToReview() {
    if (!customerId) {
      setError('Chọn khách hàng');
      return;
    }
    if (!deliveryDate) {
      setError('Đơn Pre-order bắt buộc có ngày giao hàng (YYYY-MM-DD)');
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
  cartBar: {
    position: 'absolute', left: 16, right: 16, bottom: 16,
    backgroundColor: '#1677ff', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  cartBarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  error: { color: '#d4380d', marginVertical: 4, textAlign: 'center' },
});
