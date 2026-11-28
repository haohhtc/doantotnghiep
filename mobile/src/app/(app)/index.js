import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../ctx/SessionContext';
import { useNotifications } from '../../ctx/NotificationContext';
import { apiClient, errorMessage } from '../../api/client';

function fmt(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

// "Dau ngay / Da nhan / Da xuat / Con lai" (yeu cau tv2, giong anh tham khao "Danh sach san pham
// - Ton kho nhan vien") - dung EmployeeStockService.dailySummary() moi, tinh cho ngay hom nay.
export default function Home() {
  const { session, signOut } = useSession();
  const employee = session?.employee;
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function openNotifications() {
    setNotifOpen(true);
    markAllRead();
  }

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
    setMenuOpen(false);
    await signOut();
    router.replace('/sign-in');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{session?.fullName}</Text>
          <Text style={styles.sub}>{employee ? employee.code : 'Chưa gán nhân viên'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={openNotifications} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1677ff" />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={load} style={styles.refreshBtn} disabled={loading}>
            <Ionicons name="refresh" size={20} color="#1677ff" />
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
            <Ionicons name="menu-outline" size={24} color="#444" />
          </Pressable>
        </View>
      </View>

      {/* Menu (3 gach) - hien gom "Dang xuat" (truoc day la nut rieng ngay tren Header), giong
          kieu menu goc tren-phai cua cac app pho bien, de danh cho Header gon lai. */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuSheet}>
            <Pressable style={styles.menuItem} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#d4380d" />
              <Text style={styles.menuItemText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={notifOpen} animationType="slide" transparent onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông báo</Text>
              <Pressable onPress={() => setNotifOpen(false)}>
                <Ionicons name="close" size={24} color="#444" />
              </Pressable>
            </View>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 420 }}
              ListEmptyComponent={<Text style={styles.empty}>Chưa có thông báo.</Text>}
              renderItem={({ item }) => (
                <View style={styles.notifItem}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifBody}>{item.body}</Text>
                  <Text style={styles.notifTime}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

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
    </SafeAreaView>
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
  bellBtn: { padding: 8 },
  badge: {
    position: 'absolute', top: 2, right: 2, backgroundColor: '#d4380d',
    borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  refreshBtn: { padding: 8 },
  menuBtn: { padding: 8 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuSheet: {
    position: 'absolute', top: 56, right: 16, backgroundColor: '#fff',
    borderRadius: 10, paddingVertical: 4, minWidth: 160,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { color: '#d4380d', fontWeight: '600', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  notifItem: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  notifTitle: { fontSize: 14, fontWeight: '600' },
  notifBody: { fontSize: 13, color: '#444', marginTop: 2 },
  notifTime: { fontSize: 11, color: '#999', marginTop: 4 },
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
