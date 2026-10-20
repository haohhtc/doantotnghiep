import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { apiClient, errorMessage } from '../../../api/client';

const STATUS_LABEL = { DRAFT: 'Chờ xác nhận', CLOSED: 'Đã duyệt' };

// Xem chi tiet 1 phieu Ung/Tra hang - CHI XEM, khong sua duoc vi phieu da "Da duyet" (CLOSED) ngay
// luc tao (app tu xac nhan 1 buoc) - giong moi chung tu khac trong he thong, da duyet thi khoa lai.
export default function AdvanceReturnDetail() {
  const { id, mode } = useLocalSearchParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpoint = mode === 'return' ? '/api/van-sale-returns' : '/api/van-sale-advances';
    apiClient
      .get(`${endpoint}/${id}`)
      .then((res) => setTicket(res.data.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, mode]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!ticket) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{ticket.docNumber}</Text>
        <Text style={ticket.status === 'CLOSED' ? styles.statusDone : styles.statusPending}>
          {STATUS_LABEL[ticket.status] || ticket.status}
        </Text>
      </View>
      <Text style={styles.sub}>Ngày tạo: {ticket.docDate}</Text>
      {ticket.reason ? <Text style={styles.sub}>Lý do: {ticket.reason}</Text> : null}

      <Text style={styles.sectionTitle}>Sản phẩm ({ticket.items?.length || 0})</Text>
      {ticket.items?.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.rowName} numberOfLines={2}>{item.product?.name}</Text>
          <Text style={styles.rowQty}>
            {item.quantity} {item.uom?.name || ''}
          </Text>
        </View>
      ))}

      {ticket.status !== 'CLOSED' ? (
        <Text style={styles.hint}>Phiếu chưa duyệt - không chỉnh sửa được trên app, liên hệ quản lý kho.</Text>
      ) : (
        <Text style={styles.hint}>Phiếu đã duyệt, kho đã cập nhật - không thể sửa/xoá.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  statusDone: { color: '#389e0d', fontWeight: '700' },
  statusPending: { color: '#d48806', fontWeight: '700' },
  sub: { color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 13, marginRight: 8 },
  rowQty: { fontSize: 13, fontWeight: '600' },
  hint: { color: '#999', fontSize: 12, marginTop: 20, textAlign: 'center' },
  error: { color: '#d4380d', marginTop: 20, textAlign: 'center' },
});
