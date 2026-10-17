import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSession } from '../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../api/client';

// Ung hang: lay hang tu Kho Main sang mang theo (cong Kho Van chi nhanh + Kho NV cua minh).
// Tra hang: tra lai hang dang mang theo ve Kho Main (tru Kho Van chi nhanh + Kho NV cua minh).
// Xem VanSaleAdvanceService / VanSaleReturnService o backend.
export default function AdvanceReturn() {
  const { session } = useSession();
  const employee = session?.employee;

  const [mode, setMode] = useState('advance'); // 'advance' | 'return'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [quantities, setQuantities] = useState({}); // { [productId]: '10' }
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadProducts() {
      if (!employee?.user?.branch?.id) {
        setLoadingProducts(false);
        return;
      }
      try {
        const res = await apiClient.get(`/api/branches/${employee.user.branch.id}/products`);
        // API tra ve danh sach "phan bo san pham theo chi nhanh" ({id, product, branch}), khong
        // phai Product thang - lay rieng truong product.
        setProducts(res.data.data.map((a) => a.product));
      } catch (e) {
        setMessage({ type: 'error', text: errorMessage(e) });
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, [employee]);

  function setQty(productId, value) {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
  }

  async function handleSubmit() {
    const items = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId: Number(productId), quantity: Number(qty) }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Nhập số lượng cho ít nhất 1 sản phẩm' });
      return;
    }
    if (!employee) {
      setMessage({ type: 'error', text: 'Tài khoản chưa gán Nhân viên' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const endpoint = mode === 'advance' ? '/api/van-sale-advances' : '/api/van-sale-returns';
    try {
      const createRes = await apiClient.post(endpoint, {
        docDate: new Date().toISOString().slice(0, 10),
        employeeId: employee.id,
        items,
      });
      const docId = createRes.data.data.id;
      await apiClient.post(`${endpoint}/${docId}/confirm`);
      setMessage({
        type: 'success',
        text: mode === 'advance' ? 'Ứng hàng thành công' : 'Trả hàng thành công',
      });
      setQuantities({});
    } catch (e) {
      setMessage({ type: 'error', text: errorMessage(e) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabBtn, mode === 'advance' && styles.tabBtnActive]}
          onPress={() => setMode('advance')}
        >
          <Text style={[styles.tabText, mode === 'advance' && styles.tabTextActive]}>Ứng hàng</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, mode === 'return' && styles.tabBtnActive]}
          onPress={() => setMode('return')}
        >
          <Text style={[styles.tabText, mode === 'return' && styles.tabTextActive]}>Trả hàng</Text>
        </Pressable>
      </View>

      {message ? (
        <Text style={message.type === 'error' ? styles.error : styles.success}>{message.text}</Text>
      ) : null}

      {loadingProducts ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowName}>{item.name}</Text>
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
      )}

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
  tabs: { flexDirection: 'row', marginBottom: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#1677ff' },
  tabBtn: { flex: 1, padding: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#1677ff' },
  tabText: { color: '#1677ff', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowName: { fontSize: 14, flex: 1, marginRight: 8 },
  qtyInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
  },
  submitBtn: { backgroundColor: '#1677ff', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
  success: { color: '#389e0d', marginBottom: 8, textAlign: 'center' },
});
