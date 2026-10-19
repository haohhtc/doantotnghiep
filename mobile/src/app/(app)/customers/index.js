import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSession } from '../../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../../api/client';

// Man hinh Khach hang don gian (yeu cau tv2) - bam "Ghe tham" mo man hinh Tac vu (Pre-order/
// Van Sale) cho dung khach hang do. Khong luu lai "da ghe tham luc nao" vao DB (chua can bao cao
// thoi gian ghe tham o v1 nay) - chi dieu huong thuan o app.
export default function CustomersList() {
  const { session } = useSession();
  const employee = session?.employee;
  const branchId = employee?.user?.branch?.id;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/customers');
      const mine = res.data.data.filter((c) => c.branch?.id === branchId);
      setCustomers(mine);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!employee) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên.</Text>
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
          data={customers}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có khách hàng nào.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.code}</Text>
              {item.address ? <Text style={styles.sub} numberOfLines={1}>{item.address}</Text> : null}
              <Pressable
                style={styles.visitBtn}
                onPress={() => router.push({ pathname: '/customers/visit', params: { customerId: item.id, customerName: item.name } })}
              >
                <Text style={styles.visitBtnText}>→ Ghé thăm</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  visitBtn: { marginTop: 8, alignSelf: 'flex-start' },
  visitBtnText: { color: '#1677ff', fontWeight: '600' },
  empty: { color: '#999', marginTop: 16, textAlign: 'center' },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
