import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSession } from '../../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../../api/client';

const STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
};

// Van Sale: ban xong xuat hoa don THANG, khong qua Don giao hang (xem InvoiceService.createVanSale()
// o backend). Co the xuat tung phan (vd ban it hon dat vi het hang) - sua so luong o man hinh
// [id].js, tuong tu "con lai chua xuat hoa don" cua Pre-order.
export default function VanSaleList() {
  const { session } = useSession();
  const employee = session?.employee;

  const [orders, setOrders] = useState([]);
  const [invoicedOrderIds, setInvoicedOrderIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        apiClient.get('/api/sales-orders'),
        apiClient.get('/api/invoices'),
      ]);
      const mine = ordersRes.data.data.filter(
        (o) =>
          o.orderType === 'STANDARD' &&
          employee &&
          o.salesman?.id === employee.id &&
          o.warehouse?.warehouseType === 'VAN'
      );
      mine.sort((a, b) => b.id - a.id);
      setOrders(mine);

      // Cong don so luong da xuat hoa don (theo tung san pham) cho moi don, de biet don nao da
      // xuat HET (an nut "Xuat hoa don") so voi con xuat duoc tiep (van hien nut, sang man hinh
      // [id].js de sua so luong con lai).
      const invoicedByOrder = {};
      invoicesRes.data.data
        .filter((inv) => inv.deliveryOrder == null && inv.status !== 'CANCELLED')
        .forEach((inv) => {
          const orderId = inv.salesOrder?.id;
          if (!orderId) return;
          if (!invoicedByOrder[orderId]) invoicedByOrder[orderId] = {};
          inv.items.forEach((it) => {
            invoicedByOrder[orderId][it.product.id] =
              (invoicedByOrder[orderId][it.product.id] || 0) + Number(it.quantity);
          });
        });

      const fullyInvoiced = new Set();
      mine.forEach((o) => {
        const invoicedMap = invoicedByOrder[o.id] || {};
        const allDone = o.details.every(
          (d) => (invoicedMap[d.product.id] || 0) >= Number(d.quantity)
        );
        if (allDone) fullyInvoiced.add(o.id);
      });
      setInvoicedOrderIds(fullyInvoiced);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!employee) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên - không thể bán Van Sale.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.newBtn} onPress={() => router.push('/vansale/new')}>
        <Text style={styles.newBtnText}>+ Tạo đơn Van Sale mới</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có đơn Van Sale nào.</Text>}
          renderItem={({ item }) => {
            const isInvoiced = invoicedOrderIds.has(item.id);
            return (
              <Pressable style={styles.card} onPress={() => router.push(`/vansale/${item.id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.docNumber}</Text>
                  <Text style={styles.cardStatus}>
                    {isInvoiced ? 'Đã xuất hóa đơn' : STATUS_LABEL[item.status] || item.status}
                  </Text>
                </View>
                <Text style={styles.cardSub}>{item.customer?.name}</Text>
                <Text style={styles.hint}>Chạm để xem chi tiết →</Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  newBtn: { backgroundColor: '#1677ff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  newBtnText: { color: '#fff', fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '700', fontSize: 15 },
  cardStatus: { color: '#666', fontSize: 13 },
  cardSub: { color: '#444', marginTop: 4 },
  hint: { color: '#d4380d', fontSize: 12, marginTop: 6 },
  empty: { color: '#999', marginTop: 16, textAlign: 'center' },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
