import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSession } from '../../../ctx/SessionContext';
import { apiClient, errorMessage } from '../../../api/client';

const today = () => new Date().toISOString().slice(0, 10);

// Buoc 2: Xem lai & Xac nhan don Van Sale truoc khi gui (giong preorder/review.js).
export default function ReviewVanSale() {
  const params = useLocalSearchParams();
  const { session } = useSession();
  const employee = session?.employee;

  const items = JSON.parse(params.items || '[]');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const total = items.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/api/sales-orders', {
        docDate: today(),
        customerId: Number(params.customerId),
        warehouseId: Number(params.warehouseId),
        orderType: 'STANDARD',
        salesmanId: employee.id,
        remarks: remarks || null,
        details: items.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      router.dismissAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
      {items.map((l) => (
        <View key={l.productId} style={styles.row}>
          <Text style={styles.rowName} numberOfLines={2}>{l.name}</Text>
          <Text style={styles.rowQty}>{l.quantity}</Text>
          <Text style={styles.rowPrice}>{l.unitPrice.toLocaleString('vi-VN')}</Text>
          <Text style={styles.rowTotal}>{(l.quantity * l.unitPrice).toLocaleString('vi-VN')}</Text>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Thành tiền</Text>
        <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')} đ</Text>
      </View>

      <Text style={styles.label}>Ghi chú đơn hàng</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Điền ghi chú (không bắt buộc)"
        value={remarks}
        onChangeText={setRemarks}
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Hoàn tất & Gửi dữ liệu</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowName: { flex: 1, fontSize: 12, marginRight: 4 },
  rowQty: { width: 36, fontSize: 12, textAlign: 'center' },
  rowPrice: { width: 64, fontSize: 12, textAlign: 'right' },
  rowTotal: { width: 72, fontSize: 12, fontWeight: '700', textAlign: 'right', color: '#d4380d' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 2, borderTopColor: '#d4380d', marginBottom: 8 },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#d4380d' },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#d4380d', borderRadius: 8, padding: 14, alignItems: 'center', marginVertical: 16 },
  submitText: { color: '#fff', fontWeight: '700' },
  error: { color: '#d4380d', marginVertical: 8, textAlign: 'center' },
});
