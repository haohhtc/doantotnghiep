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

function fmt(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

// "Dau ngay / Da nhan / Da xuat / Con lai" (yeu cau tv2, giong anh tham khao "Danh sach san pham
// - Ton kho nhan vien") - dung EmployeeStockService.dailySummary() moi, tinh cho ngay hom nay.
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
      const res = await apiClient.get(`/api/employee-stocks/by-employee/${employee.id}/summary`);
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

      <Text style={styles.sectionTitle}>Tồn kho NV hôm nay</Text>

      {!employee ? (
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên - không có Kho NV.</Text>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={stocks}
          keyExtractor={(item) => String(item.product.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>Chưa ứng hàng nào.</Text>}
          ListHeaderComponent={
            stocks.length > 0 ? (
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, { flex: 1 }]}>Sản phẩm</Text>
                <Text style={styles.headerCell}>Đầu ngày</Text>
                <Text style={styles.headerCell}>Đã nhận</Text>
                <Text style={styles.headerCell}>Đã xuất</Text>
                <Text style={styles.headerCell}>Còn lại</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[styles.rowName, { flex: 1 }]} numberOfLines={2}>{item.product?.name}</Text>
              <Text style={styles.cell}>{fmt(item.dauNgay)}</Text>
              <Text style={styles.cell}>{fmt(item.daNhan)}</Text>
              <Text style={styles.cell}>{fmt(item.daXuat)}</Text>
              <Text style={[styles.cell, styles.cellBold]}>{fmt(item.conLai)}</Text>
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
  headerRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: '#1677ff' },
  headerCell: { width: 62, fontSize: 11, fontWeight: '700', color: '#444', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowName: { fontSize: 13, marginRight: 4 },
  cell: { width: 62, fontSize: 12, textAlign: 'center', color: '#666' },
  cellBold: { fontWeight: '700', color: '#1677ff' },
  empty: { color: '#999', marginTop: 16 },
  error: { color: '#d4380d', marginTop: 16 },
});
