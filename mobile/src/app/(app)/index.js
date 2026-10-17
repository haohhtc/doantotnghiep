import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSession } from '../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../api/client';

export default function Home() {
  const { session, signOut } = useSession();
  const employee = session?.employee;

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!employee) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/employee-stocks/by-employee/${employee.id}`);
      setStocks(res.data.data);
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

  async function handleSignOut() {
    await signOut();
    router.replace('/sign-in');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{session?.fullName}</Text>
          <Text style={styles.sub}>{employee ? employee.code : 'Chưa gán nhân viên'}</Text>
        </View>
        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Tồn kho NV (đang mang theo)</Text>

      {!employee ? (
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên - không có Kho NV.</Text>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={stocks}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>Chưa ứng hàng nào.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowName}>{item.product?.name}</Text>
              <Text style={styles.rowQty}>{Number(item.quantity).toLocaleString('vi-VN')}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  sub: { fontSize: 13, color: '#666' },
  signOutBtn: { padding: 8 },
  signOutText: { color: '#d4380d' },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowName: { fontSize: 15, flex: 1 },
  rowQty: { fontSize: 15, fontWeight: '600' },
  empty: { color: '#999', marginTop: 16 },
  error: { color: '#d4380d', marginTop: 16 },
});
