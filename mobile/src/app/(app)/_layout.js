import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    // headerShown: false - moi tab tu ve tieu de rieng trong noi dung man hinh (hoac dung Stack
    // header rieng nhu advance-return/_layout.js) - tranh hien tieu de 2 lan (1 cua Tabs nay + 1
    // cua chinh man hinh, yeu cau nguoi dung sau khi thay bi trung "Khach hang"/"Don hang"...).
    <Tabs screenOptions={{ tabBarActiveTintColor: '#1677ff', headerShown: false }}>
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
