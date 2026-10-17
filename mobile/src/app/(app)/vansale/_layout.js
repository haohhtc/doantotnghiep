import { Stack } from 'expo-router';

export default function VanSaleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Bán hàng (Van Sale)' }} />
      <Stack.Screen name="new" options={{ title: 'Tạo đơn Van Sale' }} />
      <Stack.Screen name="[id]" options={{ title: 'Xuất hóa đơn' }} />
    </Stack>
  );
}
