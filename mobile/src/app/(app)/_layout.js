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
        name="preorder"
        options={{
          title: 'Đặt hàng',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vansale"
        options={{
          title: 'Bán hàng',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
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
