import { Stack } from 'expo-router';

export default function PreorderLayout() {
  return (
    <Stack>
      <Stack.Screen name="new" options={{ title: 'Tạo đơn Pre-order' }} />
      <Stack.Screen name="review" options={{ title: 'Xem lại & Xác nhận' }} />
      <Stack.Screen name="[id]" options={{ title: 'Chi tiết đơn' }} />
      <Stack.Screen name="edit" options={{ title: 'Sửa đơn' }} />
    </Stack>
  );
}
