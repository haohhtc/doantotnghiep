import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';

// Danh sach Tac vu cho 1 luot ghe tham (yeu cau tv2) - 2 tac vu: PreOrder va Van Sale, dieu huong
// sang man tao don tuong ung voi khach hang da chon san.
export default function Visit() {
  const { customerId, customerName } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{customerName}</Text>
      <Text style={styles.sub}>Chọn 1 tác vụ cho lượt ghé thăm này</Text>

      <Pressable
        style={styles.taskCard}
        onPress={() => router.push({ pathname: '/preorder/new', params: { customerId } })}
      >
        <Text style={styles.taskIcon}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle}>1. PreOrder</Text>
          <Text style={styles.taskSub}>Đặt hàng giao sau, trừ Kho Main</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.taskCard}
        onPress={() => router.push({ pathname: '/vansale/new', params: { customerId } })}
      >
        <Text style={styles.taskIcon}>🚐</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle}>2. Van Sale</Text>
          <Text style={styles.taskSub}>Bán giao ngay, trừ thẳng Kho NV</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable style={styles.doneBtn} onPress={() => router.back()}>
        <Text style={styles.doneBtnText}>← Kết thúc ghé thăm</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, color: '#666', marginBottom: 20 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee',
    borderRadius: 10, padding: 16, marginBottom: 12,
  },
  taskIcon: { fontSize: 28, marginRight: 12 },
  taskTitle: { fontSize: 15, fontWeight: '700' },
  taskSub: { fontSize: 12, color: '#666', marginTop: 2 },
  arrow: { fontSize: 24, color: '#ccc' },
  doneBtn: { marginTop: 20, alignItems: 'center', padding: 12 },
  doneBtnText: { color: '#666', fontWeight: '600' },
});
