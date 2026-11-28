import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const [searchText, setSearchText] = useState('');

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
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên.</Text>
      </SafeAreaView>
    );
  }

  const keyword = searchText.trim().toLowerCase();
  const filteredCustomers = keyword
    ? customers.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(keyword) ||
          (c.code || '').toLowerCase().includes(keyword) ||
          (c.address || '').toLowerCase().includes(keyword)
      )
    : customers;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Khách hàng ({filteredCustomers.length}/{customers.length})</Text>
        <Pressable onPress={load} style={styles.refreshBtn} disabled={loading}>
          <Ionicons name="refresh" size={20} color="#1677ff" />
        </Pressable>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm theo tên, mã hoặc địa chỉ khách hàng..."
        value={searchText}
        onChangeText={setSearchText}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && customers.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {customers.length === 0 ? 'Chưa có khách hàng nào.' : 'Không có khách hàng nào khớp tìm kiếm.'}
            </Text>
          }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  refreshBtn: { padding: 6 },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  visitBtn: { marginTop: 8, alignSelf: 'flex-start' },
  visitBtnText: { color: '#1677ff', fontWeight: '600' },
  empty: { color: '#999', marginTop: 16, textAlign: 'center' },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
