import { Stack } from 'expo-router';

export default function AdvanceReturnLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ứng/Trả hàng' }} />
      <Stack.Screen name="new" options={{ title: 'Tạo phiếu' }} />
      <Stack.Screen name="[id]" options={{ title: 'Chi tiết phiếu' }} />
    </Stack>
  );
}
