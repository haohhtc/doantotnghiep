import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSession } from '../../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../../api/client';

const STATUS_LABEL = {
  DRAFT: 'Chờ xác nhận',
  CLOSED: 'Đã duyệt',
};

// Lich su phieu Ung hang / Tra hang (yeu cau tv2, giong anh tham khao "Danh sach phieu ung/tra
// hang"). App tu tao+tu xac nhan ngay trong 1 lan (VanSaleAdvanceService/VanSaleReturnService -
// chi 1 NVBH thao tac, khong can nguoi khac duyet) nen phieu hau het se la "Da duyet" ngay.
export default function AdvanceReturnHistory() {
  const { session } = useSession();
  const employee = session?.employee;

  const [mode, setMode] = useState('advance'); // 'advance' | 'return'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!employee) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const endpoint = mode === 'advance' ? '/api/van-sale-advances' : '/api/van-sale-returns';
    try {
      const res = await apiClient.get(endpoint);
      const mine = res.data.data
        .filter((t) => t.employee?.id === employee.id)
        .sort((a, b) => b.id - a.id);
      setTickets(mine);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [mode, employee]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabBtn, mode === 'advance' && styles.tabBtnActive]}
          onPress={() => setMode('advance')}
        >
          <Text style={[styles.tabText, mode === 'advance' && styles.tabTextActive]}>Ứng hàng</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, mode === 'return' && styles.tabBtnActive]}
          onPress={() => setMode('return')}
        >
          <Text style={[styles.tabText, mode === 'return' && styles.tabTextActive]}>Trả hàng</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.newBtn}
        onPress={() => router.push({ pathname: '/advance-return/new', params: { mode } })}
      >
        <Text style={styles.newBtnText}>
          {mode === 'advance' ? '+ Tạo phiếu ứng hàng' : '+ Tạo phiếu trả hàng'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!employee ? (
        <Text style={styles.empty}>Tài khoản này chưa gán Nhân viên.</Text>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có phiếu nào.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: `/advance-return/${item.id}`, params: { mode } })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.docNumber}</Text>
                <Text style={item.status === 'CLOSED' ? styles.statusDone : styles.statusPending}>
                  {STATUS_LABEL[item.status] || item.status}
                </Text>
              </View>
              <Text style={styles.cardSub}>Ngày tạo: {item.docDate}</Text>
              <Text style={styles.cardSub}>
                {item.items?.length || 0} sản phẩm
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#1677ff' },
  tabBtn: { flex: 1, padding: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#1677ff' },
  tabText: { color: '#1677ff', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  newBtn: { backgroundColor: '#389e0d', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  newBtnText: { color: '#fff', fontWeight: '600' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '700', fontSize: 15 },
  cardSub: { color: '#666', fontSize: 13, marginTop: 2 },
  statusDone: { color: '#389e0d', fontSize: 13, fontWeight: '600' },
  statusPending: { color: '#d48806', fontSize: 13, fontWeight: '600' },
  empty: { color: '#999', marginTop: 16, textAlign: 'center' },
  error: { color: '#d4380d', marginBottom: 8, textAlign: 'center' },
});
