import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SessionProvider, useSession } from '../ctx/SessionContext';

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
        {/* preorder/vansale nam NGOAI (app) (khong thuoc Tabs) - router.push tu Ghe tham khach
            hang (customers/visit.js) can dieu huong sang day on dinh tren ca web (truoc dung
            options href:null trong Tabs.Screen de an tab nhung van dieu huong duoc, nhung tren
            web preview dieu huong cheo tab bi loi roi ve lai tab Tong quan - xem dalam.md
            2026-11-04). Dua ra ngoai Tabs la cach chac chan khong dinh loi nay. */}
        <Stack.Screen name="preorder" />
        <Stack.Screen name="vansale" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
