import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../../api/client';

const TYPE_LABEL = { PRE_ORDER: 'Đặt hàng', STANDARD: 'Bán hàng' };

const STEP_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'DONE', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

// Tinh "dang o buoc nao" trong chuoi Don hang ban -> Don giao hang -> Hoa don (yeu cau nguoi dung:
// chi xem trang thai SalesOrder "Da xac nhan" khong biet duoc da tao/giao Don giao hang hay xuat
// Hoa don chua - xem dalam.md). Khong tai toan bo Don giao hang/Hoa don (nang) - chi tai 2 bulk
// endpoint nhe (salesOrderId + status/co hoa don khong), xem DeliveryOrderController/InvoiceController.
function computeStep(order, doStatusesByOrder, invoicedSet) {
  if (order.status === 'PENDING') return { key: 'PENDING', label: 'Chờ xác nhận', color: '#d48806' };
  if (order.status === 'CANCELLED') return { key: 'CANCELLED', label: 'Đã hủy', color: '#999' };

  // CONFIRMED tu day tro xuong:
  if (invoicedSet.has(order.id)) {
    return { key: 'DONE', label: 'Hoàn tất (đã xuất hóa đơn)', color: '#389e0d' };
  }
  const doStatuses = doStatusesByOrder.get(order.id) || new Set();
  if (doStatuses.has('CLOSED')) {
    return { key: 'PROCESSING', label: 'Đã giao - chờ xuất hóa đơn', color: '#1677ff' };
  }
  if (doStatuses.has('DRAFT')) {
    return { key: 'PROCESSING', label: 'Đang chờ giao hàng', color: '#1677ff' };
  }
  if (order.orderType === 'PRE_ORDER') {
    return { key: 'PROCESSING', label: 'Đã duyệt - chờ tạo đơn giao hàng', color: '#666' };
  }
  // STANDARD (Van Sale): khong co buoc Don giao hang, xuat hoa don thang.
  return { key: 'PROCESSING', label: 'Đã duyệt - chờ xuất hóa đơn', color: '#666' };
}

// Gop chung 2 loai don (Pre-order + Van Sale) vao 1 tab "Don hang" (yeu cau tv2) - tao don moi chi
// con lam qua "Ghe tham khach hang" (customers/visit.js), tab nay chi de xem lai lich su don da tao.
export default function OrdersList() {
  const { session } = useSession();
  const employee = session?.employee;

  const [orders, setOrders] = useState([]);
  const [doStatusesByOrder, setDoStatusesByOrder] = useState(new Map());
  const [invoicedSet, setInvoicedSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [stepFilter, setStepFilter] = useState('ALL');

  const load = useCallback(async () => {
    if (!employee) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Loc thang o server theo salesmanId (du lieu that co the toi hang ngan don - tai het ca
      // bang roi loc o client se rat nang cho mobile, xem SalesOrderController.search()).
      const [ordersRes, doStatusRes, invoicedRes] = await Promise.all([
        apiClient.get('/api/sales-orders/search', { params: { salesmanId: employee.id, size: 500 } }),
        apiClient.get('/api/delivery-orders/status-by-sales-order'),
        apiClient.get('/api/invoices/active-sales-order-ids'),
      ]);
      const mine = ordersRes.data.data.content.filter(
        (o) => o.orderType === 'PRE_ORDER' || o.orderType === 'STANDARD'
      );
      setOrders(mine);

      const doMap = new Map();
      doStatusRes.data.data.forEach((row) => {
        if (!doMap.has(row.salesOrderId)) doMap.set(row.salesOrderId, new Set());
        doMap.get(row.salesOrderId).add(row.status);
      });
      setDoStatusesByOrder(doMap);
      setInvoicedSet(new Set(invoicedRes.data.data));
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

  const ordersWithStep = useMemo(
    () => orders.map((o) => ({ ...o, step: computeStep(o, doStatusesByOrder, invoicedSet) })),
    [orders, doStatusesByOrder, invoicedSet]
  );

  const filteredOrders = ordersWithStep.filter((o) => {
    if (stepFilter !== 'ALL' && o.step.key !== stepFilter) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return (
      o.docNumber.toLowerCase().includes(keyword) ||
      (o.customer?.name || '').toLowerCase().includes(keyword)
    );
  });

  if (!employee) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên - không thể xem đơn hàng.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Đơn hàng ({filteredOrders.length}/{orders.length})</Text>
        <Pressable onPress={load} style={styles.refreshBtn} disabled={loading}>
          <Ionicons name="refresh" size={20} color="#1677ff" />
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Tìm theo số đơn hoặc tên khách hàng..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={styles.filterRow}>
        <FlatList
          data={STEP_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, stepFilter === item.value && styles.filterChipActive]}
              onPress={() => setStepFilter(item.value)}
            >
              <Text style={[styles.filterChipText, stepFilter === item.value && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && orders.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {orders.length === 0
                ? 'Chưa có đơn nào. Vào tab Khách hàng → Ghé thăm để tạo đơn mới.'
                : 'Không có đơn nào khớp bộ lọc.'}
            </Text>
          }
          renderItem={({ item }) => {
            const isPreorder = item.orderType === 'PRE_ORDER';
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(isPreorder ? `/preorder/${item.id}` : `/vansale/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.typeBadge, isPreorder ? styles.typeBadgePreorder : styles.typeBadgeVansale]}>
                    <Text style={styles.typeBadgeText}>{TYPE_LABEL[item.orderType]}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.docNumber}</Text>
                </View>
                <Text style={styles.cardSub}>{item.customer?.name}</Text>
                <Text style={[styles.cardStep, { color: item.step.color }]}>{item.step.label}</Text>
                <Text style={styles.hint}>Chạm để xem chi tiết →</Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  refreshBtn: { padding: 6 },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  filterRow: { marginBottom: 8 },
  filterChip: {
    borderWidth: 1, borderColor: '#1677ff', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#1677ff' },
  filterChipText: { color: '#1677ff', fontSize: 13 },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  typeBadgePreorder: { backgroundColor: '#e6f4ff' },
  typeBadgeVansale: { backgroundColor: '#fff1f0' },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#444' },
  cardTitle: { fontWeight: '700', fontSize: 15, flex: 1 },
  cardSub: { color: '#444', marginTop: 4 },
  cardStep: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  hint: { color: '#1677ff', fontSize: 12, marginTop: 6 },
  empty: { color: '#999', marginTop: 16, textAlign: 'center' },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
