import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { apiClient, errorMessage } from '../../../api/client';

// Chuoi Pre-order: Don hang ban (CONFIRMED) -> Don giao hang (tao -> xac nhan) -> Hoa don.
// Man hinh nay di tiep 3 buoc do cho 1 don cu the - danh cho truong hop pho bien 1 don = 1 dot
// giao duy nhat (NVBH giao tay 1 lan); giao nhieu dot/xuat hoa don tung phan van phai lam tren web.
export default function PreorderDetail() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [deliveryOrder, setDeliveryOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, dosRes] = await Promise.all([
        apiClient.get(`/api/sales-orders/${id}`),
        apiClient.get('/api/delivery-orders'),
      ]);
      setOrder(orderRes.data.data);
      const activeDos = dosRes.data.data
        .filter((d) => d.salesOrder?.id === Number(id) && d.status !== 'CANCELLED')
        .sort((a, b) => b.id - a.id);
      setDeliveryOrder(activeDos[0] || null);
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

  async function handleCreateDeliveryOrder() {
    setActing(true);
    setError(null);
    try {
      await apiClient.post('/api/delivery-orders', { salesOrderId: Number(id) });
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setActing(false);
    }
  }

  async function handleConfirmDelivery() {
    setActing(true);
    setError(null);
    try {
      await apiClient.post(`/api/delivery-orders/${deliveryOrder.id}/confirm`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setActing(false);
    }
  }

  async function handleInvoice() {
    setActing(true);
    setError(null);
    try {
      await apiClient.post('/api/invoices', {
        deliveryOrderId: deliveryOrder.id,
        items: deliveryOrder.items.map((it) => ({
          productId: it.product.id,
          uomId: it.uom?.id,
          quantity: it.quantity,
        })),
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setActing(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!order) return <Text style={styles.error}>{error}</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{order.docNumber}</Text>
      <Text style={styles.sub}>{order.customer?.name}</Text>
      <Text style={styles.sub}>Giao hàng: {order.deliveryDate}</Text>

      <Text style={styles.label}>Sản phẩm đặt</Text>
      {order.details.map((d) => (
        <View key={d.id} style={styles.row}>
          <Text style={styles.rowName}>{d.product.name}</Text>
          <Text style={styles.rowQty}>
            {d.quantity} {d.uom?.name || ''}
          </Text>
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.stepBox}>
        {!deliveryOrder ? (
          <>
            <Text style={styles.stepLabel}>Bước tiếp: tạo Đơn giao hàng</Text>
            <Pressable style={styles.actionBtn} onPress={handleCreateDeliveryOrder} disabled={acting}>
              {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Tạo đơn giao hàng</Text>}
            </Pressable>
          </>
        ) : deliveryOrder.status === 'DRAFT' ? (
          <>
            <Text style={styles.stepLabel}>Đơn giao {deliveryOrder.docNumber} - chờ giao</Text>
            <Pressable style={styles.actionBtn} onPress={handleConfirmDelivery} disabled={acting}>
              {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Xác nhận đã giao hàng</Text>}
            </Pressable>
          </>
        ) : deliveryOrder.status === 'CLOSED' ? (
          <>
            <Text style={styles.stepLabel}>Đơn giao {deliveryOrder.docNumber} - đã giao, chờ xuất hóa đơn</Text>
            <Pressable style={[styles.actionBtn, { backgroundColor: '#d4380d' }]} onPress={handleInvoice} disabled={acting}>
              {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Xuất hóa đơn</Text>}
            </Pressable>
          </>
        ) : (
          <Text style={styles.stepLabel}>Đơn giao {deliveryOrder.docNumber}: {deliveryOrder.status}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { color: '#666', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1 },
  rowQty: { fontWeight: '600' },
  stepBox: { marginTop: 20, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  stepLabel: { marginBottom: 8, color: '#333' },
  actionBtn: { backgroundColor: '#389e0d', borderRadius: 8, padding: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d4380d', marginVertical: 8, textAlign: 'center' },
});
