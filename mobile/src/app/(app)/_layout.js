import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Tổng quan' }} />
      <Tabs.Screen name="preorder" options={{ title: 'Đặt hàng' }} />
      <Tabs.Screen name="vansale" options={{ title: 'Bán hàng' }} />
      <Tabs.Screen name="advance-return" options={{ title: 'Ứng/Trả' }} />
    </Tabs>
  );
}
