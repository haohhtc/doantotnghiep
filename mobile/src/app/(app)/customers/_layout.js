import { Stack } from 'expo-router';

export default function CustomersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Khách hàng' }} />
      <Stack.Screen name="visit" options={{ title: 'Ghé thăm' }} />
    </Stack>
  );
}
