import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { apiClient, errorMessage } from '../../../api/client';

const STATUS_LABEL = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy' };

// Xem chi tiet day du 1 don Pre-order. PENDING: cho sua/xoa/xac nhan (dung API update/delete da co
// san, chi cho phep khi con PENDING - xem SalesOrderService.requirePending()). CONFIRMED: di tiep
// chuoi Don giao hang -> Hoa don (truong hop pho bien 1 don = 1 dot giao).
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

  async function handleConfirmOrder() {
    setActing(true);
    setError(null);
    try {
      await apiClient.post(`/api/sales-orders/${id}/confirm`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setActing(false);
    }
  }

  function handleDelete() {
    Alert.alert('Xóa đơn', `Xóa đơn ${order.docNumber}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setActing(true);
          setError(null);
          try {
            await apiClient.delete(`/api/sales-orders/${id}`);
            router.back();
          } catch (e) {
            setError(errorMessage(e));
            setActing(false);
          }
        },
      },
    ]);
  }

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

  const total = order.details.reduce((sum, d) => sum + d.quantity * d.unitPrice, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{order.docNumber}</Text>
        <Text style={styles.status}>{STATUS_LABEL[order.status] || order.status}</Text>
      </View>
      <Text style={styles.sub}>{order.customer?.name}</Text>
      <Text style={styles.sub}>Ngày giao: {order.deliveryDate}</Text>
      {order.remarks ? <Text style={styles.sub}>Ghi chú: {order.remarks}</Text> : null}

      <Text style={styles.label}>Sản phẩm</Text>
      {order.details.map((d) => (
        <View key={d.id} style={styles.row}>
          <Text style={styles.rowName} numberOfLines={2}>{d.product.name}</Text>
          <Text style={styles.rowQty}>{d.quantity} {d.uom?.name || ''}</Text>
          <Text style={styles.rowPrice}>{(d.quantity * d.unitPrice).toLocaleString('vi-VN')}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Thành tiền</Text>
        <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')} đ</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {order.status === 'PENDING' ? (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => router.push({ pathname: '/preorder/edit', params: { id } })}
            disabled={acting}
          >
            <Text style={styles.actionBtnText}>Sửa đơn</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete} disabled={acting}>
            <Text style={styles.actionBtnText}>Xóa đơn</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.confirmBtn]} onPress={handleConfirmOrder} disabled={acting}>
            {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Xác nhận</Text>}
          </Pressable>
        </View>
      ) : order.status === 'CONFIRMED' ? (
        <View style={styles.stepBox}>
          {!deliveryOrder ? (
            <>
              <Text style={styles.stepLabel}>Bước tiếp: tạo Đơn giao hàng</Text>
              <Pressable style={[styles.actionBtn, styles.confirmBtn]} onPress={handleCreateDeliveryOrder} disabled={acting}>
                {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Tạo đơn giao hàng</Text>}
              </Pressable>
            </>
          ) : deliveryOrder.status === 'DRAFT' ? (
            <>
              <Text style={styles.stepLabel}>Đơn giao {deliveryOrder.docNumber} - chờ giao</Text>
              <Pressable style={[styles.actionBtn, styles.confirmBtn]} onPress={handleConfirmDelivery} disabled={acting}>
                {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Xác nhận đã giao hàng</Text>}
              </Pressable>
            </>
          ) : deliveryOrder.status === 'CLOSED' ? (
            <>
              <Text style={styles.stepLabel}>Đơn giao {deliveryOrder.docNumber} - đã giao, chờ xuất hóa đơn</Text>
              <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={handleInvoice} disabled={acting}>
                {acting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Xuất hóa đơn</Text>}
              </Pressable>
            </>
          ) : (
            <Text style={styles.stepLabel}>Đơn giao {deliveryOrder.docNumber}: {deliveryOrder.status}</Text>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  status: { color: '#1677ff', fontWeight: '700' },
  sub: { color: '#666', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 13 },
  rowQty: { width: 60, fontSize: 13, textAlign: 'center' },
  rowPrice: { width: 80, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 2, borderTopColor: '#1677ff' },
  totalLabel: { fontWeight: '700' },
  totalValue: { fontWeight: '700', color: '#1677ff' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  stepBox: { marginTop: 20, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  stepLabel: { marginBottom: 8, color: '#333' },
  actionBtn: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  editBtn: { backgroundColor: '#1677ff' },
  deleteBtn: { backgroundColor: '#d4380d' },
  confirmBtn: { backgroundColor: '#389e0d' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d4380d', marginVertical: 8, textAlign: 'center' },
});
