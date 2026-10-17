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

export default function PreorderList() {
  const { session } = useSession();
  const employee = session?.employee;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/sales-orders');
      const mine = res.data.data.filter(
        (o) => o.orderType === 'PRE_ORDER' && employee && o.salesman?.id === employee.id
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

  async function handleConfirm(id) {
    setConfirmingId(id);
    try {
      await apiClient.post(`/api/sales-orders/${id}/confirm`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setConfirmingId(null);
    }
  }

  if (!employee) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên - không thể tạo đơn Pre-order.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.newBtn} onPress={() => router.push('/preorder/new')}>
        <Text style={styles.newBtnText}>+ Tạo đơn Pre-order mới</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có đơn Pre-order nào.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.docNumber}</Text>
                <Text style={styles.cardStatus}>{STATUS_LABEL[item.status] || item.status}</Text>
              </View>
              <Text style={styles.cardSub}>{item.customer?.name}</Text>
              {item.status === 'PENDING' ? (
                <Pressable
                  style={styles.confirmBtn}
                  onPress={() => handleConfirm(item.id)}
                  disabled={confirmingId === item.id}
                >
                  {confirmingId === item.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Xác nhận đơn</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          )}
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
  confirmBtn: { backgroundColor: '#389e0d', borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { color: '#999', marginTop: 16, textAlign: 'center' },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
