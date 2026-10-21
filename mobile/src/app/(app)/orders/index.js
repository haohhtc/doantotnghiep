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

const TYPE_LABEL = { PRE_ORDER: 'Đặt hàng', STANDARD: 'Bán hàng' };

// Gop chung 2 loai don (Pre-order + Van Sale) vao 1 tab "Don hang" (yeu cau tv2) - tao don moi chi
// con lam qua "Ghe tham khach hang" (customers/visit.js), tab nay chi de xem lai lich su don da tao.
export default function OrdersList() {
  const { session } = useSession();
  const employee = session?.employee;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/sales-orders');
      const mine = res.data.data.filter(
        (o) =>
          employee &&
          o.salesman?.id === employee.id &&
          (o.orderType === 'PRE_ORDER' || o.orderType === 'STANDARD')
      );
      mine.sort((a, b) => b.id - a.id);
      setOrders(mine);
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
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên - không thể xem đơn hàng.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có đơn nào. Vào tab Khách hàng → Ghé thăm để tạo đơn mới.</Text>
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
                  <Text style={styles.cardStatus}>{STATUS_LABEL[item.status] || item.status}</Text>
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
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  typeBadgePreorder: { backgroundColor: '#e6f4ff' },
  typeBadgeVansale: { backgroundColor: '#fff1f0' },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#444' },
  cardTitle: { fontWeight: '700', fontSize: 15, flex: 1 },
  cardStatus: { color: '#666', fontSize: 13 },
  cardSub: { color: '#444', marginTop: 4 },
  hint: { color: '#1677ff', fontSize: 12, marginTop: 6 },
  empty: { color: '#999', marginTop: 16, textAlign: 'center' },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
