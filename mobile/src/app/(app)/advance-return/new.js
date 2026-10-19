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

// Ung hang: lay hang tu Kho Main sang mang theo (cong Kho Van chi nhanh + Kho NV cua minh).
// Tra hang: tra lai hang dang mang theo ve Kho Main (tru Kho Van chi nhanh + Kho NV cua minh).
// "Ton NPP" hien ben canh "Kho NV" (yeu cau tv2, giong anh tham khao "Tao phieu ung hang") - voi
// Ung hang la ton Kho Main (nguon xuat ra); voi Tra hang la ton Kho Van (noi se nhan lai).
export default function NewAdvanceReturn() {
  const { mode: modeParam } = useLocalSearchParams();
  const mode = modeParam === 'return' ? 'return' : 'advance';
  const { session } = useSession();
  const employee = session?.employee;

  const [products, setProducts] = useState([]);
  const [nppStock, setNppStock] = useState({}); // { [productId]: number }
  const [nvStock, setNvStock] = useState({}); // { [productId]: number }
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      const branchId = employee?.user?.branch?.id;
      if (!branchId) {
        setLoading(false);
        return;
      }
      try {
        const [productsRes, warehousesRes, stockRes, empStockRes] = await Promise.all([
          apiClient.get(`/api/branches/${branchId}/products`),
          apiClient.get('/api/warehouses'),
          apiClient.get('/api/stock'),
          apiClient.get(`/api/employee-stocks/by-employee/${employee.id}`),
        ]);
        const prods = productsRes.data.data.map((a) => a.product);
        setProducts(prods);

        const targetType = mode === 'advance' ? 'MAIN' : 'VAN';
        const warehouse = warehousesRes.data.data.find(
          (w) => w.branch?.id === branchId && w.warehouseType === targetType
        );
        const npp = {};
        if (warehouse) {
          stockRes.data.data
            .filter((s) => s.warehouse?.id === warehouse.id)
            .forEach((s) => { npp[s.product.id] = Number(s.quantity); });
        }
        setNppStock(npp);

        const nv = {};
        empStockRes.data.data.forEach((s) => { nv[s.product.id] = Number(s.quantity); });
        setNvStock(nv);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [employee, mode]);

  function setQty(productId, value) {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
  }

  async function handleSubmit() {
    const items = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId: Number(productId), quantity: Number(qty) }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setError('Nhập số lượng cho ít nhất 1 sản phẩm');
      return;
    }
    if (!employee) {
      setError('Tài khoản chưa gán Nhân viên');
      return;
    }

    setSubmitting(true);
    setError(null);
    const endpoint = mode === 'advance' ? '/api/van-sale-advances' : '/api/van-sale-returns';
    try {
      const createRes = await apiClient.post(endpoint, {
        docDate: new Date().toISOString().slice(0, 10),
        employeeId: employee.id,
        items,
      });
      const docId = createRes.data.data.id;
      await apiClient.post(`${endpoint}/${docId}/confirm`);
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
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, { flex: 1 }]}>Sản phẩm</Text>
        <Text style={styles.headerCell}>Tồn NPP</Text>
        <Text style={styles.headerCell}>Kho NV</Text>
        <Text style={styles.headerCellSmall}>SL</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.rowName, { flex: 1 }]} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.rowStock}>{nppStock[item.id] ?? 0}</Text>
            <Text style={styles.rowStock}>{nvStock[item.id] ?? 0}</Text>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              placeholder="0"
              value={quantities[item.id] || ''}
              onChangeText={(v) => setQty(item.id, v)}
            />
          </View>
        )}
      />

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {mode === 'advance' ? 'Xác nhận Ứng hàng' : 'Xác nhận Trả hàng'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: '#1677ff' },
  headerCell: { width: 70, fontSize: 12, fontWeight: '700', color: '#444', textAlign: 'center' },
  headerCellSmall: { width: 60, fontSize: 12, fontWeight: '700', color: '#444', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowName: { fontSize: 13, marginRight: 4 },
  rowStock: { width: 70, fontSize: 13, textAlign: 'center', color: '#666' },
  qtyInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 6,
    textAlign: 'center',
  },
  submitBtn: { backgroundColor: '#1677ff', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
