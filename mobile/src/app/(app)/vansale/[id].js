import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { apiClient, errorMessage } from '../../../api/client';

const STATUS_LABEL = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy' };

// Xem chi tiet day du 1 don Van Sale. PENDING: cho sua/xoa/xac nhan (API update/delete chi cho
// phep khi con PENDING). CONFIRMED: dan sang man invoice.js rieng de xuat hoa don.
export default function VanSaleDetail() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [invoicedByProduct, setInvoicedByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, invoicesRes] = await Promise.all([
        apiClient.get(`/api/sales-orders/${id}`),
        apiClient.get('/api/invoices'),
      ]);
      setOrder(orderRes.data.data);
      const map = {};
      invoicesRes.data.data
        .filter((inv) => inv.salesOrder?.id === Number(id) && inv.deliveryOrder == null && inv.status !== 'CANCELLED')
        .forEach((inv) => {
          inv.items.forEach((it) => {
            map[it.product.id] = (map[it.product.id] || 0) + Number(it.quantity);
          });
        });
      setInvoicedByProduct(map);
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

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!order) return <Text style={styles.error}>{error}</Text>;

  const total = order.details.reduce((sum, d) => sum + d.quantity * d.unitPrice, 0);
  const fullyInvoiced = order.details.every((d) => (invoicedByProduct[d.product.id] || 0) >= Number(d.quantity));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{order.docNumber}</Text>
        <Text style={styles.status}>
          {order.status === 'CONFIRMED' && fullyInvoiced ? 'Đã xuất hóa đơn' : STATUS_LABEL[order.status] || order.status}
        </Text>
      </View>
      <Text style={styles.sub}>{order.customer?.name}</Text>
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
            onPress={() => router.push({ pathname: '/vansale/edit', params: { id } })}
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
      ) : order.status === 'CONFIRMED' && !fullyInvoiced ? (
        <Pressable
          style={[styles.actionBtn, styles.invoiceBtn, { marginTop: 20 }]}
          onPress={() => router.push({ pathname: '/vansale/invoice', params: { id } })}
        >
          <Text style={styles.actionBtnText}>Xuất hóa đơn</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  status: { color: '#d4380d', fontWeight: '700' },
  sub: { color: '#666', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 13 },
  rowQty: { width: 60, fontSize: 13, textAlign: 'center' },
  rowPrice: { width: 80, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 2, borderTopColor: '#d4380d' },
  totalLabel: { fontWeight: '700' },
  totalValue: { fontWeight: '700', color: '#d4380d' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  editBtn: { backgroundColor: '#1677ff' },
  deleteBtn: { backgroundColor: '#999' },
  confirmBtn: { backgroundColor: '#389e0d' },
  invoiceBtn: { backgroundColor: '#d4380d' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  error: { color: '#d4380d', marginVertical: 8, textAlign: 'center' },
});
