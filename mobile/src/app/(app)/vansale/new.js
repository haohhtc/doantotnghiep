import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSession } from '../../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../../api/client';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewVanSale() {
  const { session } = useSession();
  const employee = session?.employee;
  const branchId = employee?.user?.branch?.id;

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [vanWarehouseId, setVanWarehouseId] = useState(null);

  const [customerId, setCustomerId] = useState(null);
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
        const [customersRes, productsRes, warehousesRes] = await Promise.all([
          apiClient.get('/api/customers'),
          apiClient.get(`/api/branches/${branchId}/products`),
          apiClient.get('/api/warehouses'),
        ]);
        setCustomers(customersRes.data.data.filter((c) => c.branch?.id === branchId));
        // API tra ve danh sach "phan bo san pham theo chi nhanh" ({id, product, branch}), khong
        // phai Product thang - lay rieng truong product.
        setProducts(productsRes.data.data.map((a) => a.product));
        const van = warehousesRes.data.data.find(
          (w) => w.branch?.id === branchId && w.warehouseType === 'VAN'
        );
        setVanWarehouseId(van?.id || null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [branchId]);

  async function lookupPrice(productId, qty) {
    if (!customerId || !vanWarehouseId || Number(qty) <= 0) return;
    try {
      const res = await apiClient.get('/api/price-lists/lookup', {
        params: {
          productId,
          customerId,
          warehouseId: vanWarehouseId,
          purpose: 'SALE',
          date: today(),
        },
      });
      if (res.data.data != null) {
        setPrices((prev) => ({ ...prev, [productId]: res.data.data }));
      }
    } catch {
      // Khong tim duoc gia tu dong - de nguoi dung tu nhap, khong chan luong tao don.
    }
  }

  function setQty(productId, value) {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
    lookupPrice(productId, value);
  }

  function setPrice(productId, value) {
    setPrices((prev) => ({ ...prev, [productId]: value }));
  }

  async function handleSubmit() {
    if (!customerId) {
      setError('Chọn khách hàng');
      return;
    }
    if (!vanWarehouseId) {
      setError('Chi nhánh chưa có Kho Van');
      return;
    }
    const details = Object.entries(quantities)
      .map(([productId, qty]) => ({
        productId: Number(productId),
        quantity: Number(qty),
        unitPrice: Number(prices[productId] || 0),
      }))
      .filter((d) => d.quantity > 0);
    if (details.length === 0) {
      setError('Nhập số lượng cho ít nhất 1 sản phẩm');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/api/sales-orders', {
        docDate: today(),
        customerId,
        warehouseId: vanWarehouseId,
        orderType: 'STANDARD',
        salesmanId: employee.id,
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
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Khách hàng</Text>
      <FlatList
        data={customers}
        horizontal
        keyExtractor={(item) => String(item.id)}
        style={{ marginBottom: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, customerId === item.id && styles.chipActive]}
            onPress={() => setCustomerId(item.id)}
          >
            <Text style={[styles.chipText, customerId === item.id && styles.chipTextActive]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      <Text style={styles.label}>Sản phẩm</Text>
      {products.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.rowName}>{item.name}</Text>
          <TextInput
            style={styles.qtyInput}
            keyboardType="numeric"
            placeholder="SL"
            value={quantities[item.id] || ''}
            onChangeText={(v) => setQty(item.id, v)}
          />
          <TextInput
            style={styles.priceInput}
            keyboardType="numeric"
            placeholder="Giá"
            value={prices[item.id] != null ? String(prices[item.id]) : ''}
            onChangeText={(v) => setPrice(item.id, v)}
          />
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Tạo đơn</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: '#1677ff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActive: { backgroundColor: '#1677ff' },
  chipText: { color: '#1677ff' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 13 },
  qtyInput: { width: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, textAlign: 'center', marginRight: 6 },
  priceInput: { width: 80, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, textAlign: 'center' },
  submitBtn: { backgroundColor: '#1677ff', borderRadius: 8, padding: 14, alignItems: 'center', marginVertical: 16 },
  submitText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d4380d', marginVertical: 8, textAlign: 'center' },
});
