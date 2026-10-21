import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Đơn hàng' }} />
    </Stack>
  );
}
