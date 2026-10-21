import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#1677ff' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Khách hàng',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      {/* Dat hang/Ban hang khong con la tab rieng (yeu cau tv2) - tao don chi qua Ghe tham khach
          hang (customers/visit.js); href: null giu route dieu huong duoc nhung an khoi thanh tab. */}
      <Tabs.Screen name="preorder" options={{ href: null }} />
      <Tabs.Screen name="vansale" options={{ href: null }} />
      <Tabs.Screen
        name="advance-return"
        options={{
          title: 'Ứng/Trả',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
