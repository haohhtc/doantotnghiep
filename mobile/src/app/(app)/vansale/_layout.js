import { Stack } from 'expo-router';

export default function VanSaleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Bán hàng (Van Sale)' }} />
      <Stack.Screen name="new" options={{ title: 'Tạo đơn Van Sale' }} />
      <Stack.Screen name="review" options={{ title: 'Xem lại & Xác nhận' }} />
      <Stack.Screen name="[id]" options={{ title: 'Chi tiết đơn' }} />
      <Stack.Screen name="edit" options={{ title: 'Sửa đơn' }} />
      <Stack.Screen name="invoice" options={{ title: 'Xuất hóa đơn' }} />
    </Stack>
  );
}
