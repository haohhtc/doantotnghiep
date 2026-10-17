import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { apiClient, errorMessage } from '../../../api/client';

// Xuat hoa don Van Sale co the sua lai so luong truoc khi xuat (vd ban it hon dat vi het hang) -
// cong don cac hoa don Van Sale khac da xuat cho cung don de tinh "con lai" dung, giong cach Pre-order
// tinh "con lai chua giao/xuat hoa don" (xem InvoiceService.assertWithinOrdered() o backend).
export default function VanSaleDetail() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [remaining, setRemaining] = useState({}); // { [productId]: number }
  const [quantities, setQuantities] = useState({}); // { [productId]: string }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, invoicesRes] = await Promise.all([
        apiClient.get(`/api/sales-orders/${id}`),
        apiClient.get('/api/invoices'),
      ]);
      const ord = orderRes.data.data;
      setOrder(ord);

      const alreadyByProduct = {};
      invoicesRes.data.data
        .filter((inv) => inv.salesOrder?.id === Number(id) && inv.deliveryOrder == null && inv.status !== 'CANCELLED')
        .forEach((inv) => {
          inv.items.forEach((it) => {
            alreadyByProduct[it.product.id] = (alreadyByProduct[it.product.id] || 0) + Number(it.quantity);
          });
        });

      const rem = {};
      const initialQty = {};
      ord.details.forEach((d) => {
        const left = Number(d.quantity) - (alreadyByProduct[d.product.id] || 0);
        rem[d.product.id] = left;
        initialQty[d.product.id] = left > 0 ? String(left) : '';
      });
      setRemaining(rem);
      setQuantities(initialQty);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function setQty(productId, value) {
    setQuantities((prev) => ({ ...prev, [productId]: value }));
  }

  async function handleSubmit() {
    const items = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId: Number(productId), quantity: Number(qty) }))
      .filter((it) => it.quantity > 0);
    if (items.length === 0) {
      setError('Nhập số lượng cho ít nhất 1 sản phẩm');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/api/invoices/van-sale', { salesOrderId: Number(id), items });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!order) return <Text style={styles.error}>{error}</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{order.docNumber}</Text>
      <Text style={styles.sub}>{order.customer?.name}</Text>

      <Text style={styles.label}>Số lượng xuất hóa đơn (còn lại trong ngoặc)</Text>
      {order.details.map((d) => (
        <View key={d.id} style={styles.row}>
          <Text style={styles.rowName}>
            {d.product.name} ({remaining[d.product.id] ?? d.quantity})
          </Text>
          <TextInput
            style={styles.qtyInput}
            keyboardType="numeric"
            value={quantities[d.product.id] || ''}
            onChangeText={(v) => setQty(d.product.id, v)}
          />
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Xuất hóa đơn</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { color: '#666', marginTop: 2, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 14, marginRight: 8 },
  qtyInput: { width: 70, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, textAlign: 'center' },
  submitBtn: { backgroundColor: '#d4380d', borderRadius: 8, padding: 14, alignItems: 'center', marginVertical: 16 },
  submitText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d4380d', marginVertical: 8, textAlign: 'center' },
});
