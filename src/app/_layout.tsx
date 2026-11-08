// Апп-ын үндсэн layout: AuthProvider-оор бүх дэлгэцийг ороож, Stack навигаци тохируулна
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LoadingView } from '@/components/StateViews';
import { colors } from '@/lib/theme';

function RootStack() {
  const { loading } = useAuth();
  // SecureStore-оос session уншиж дуустал spinner харуулна
  if (loading) return <LoadingView />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Буцах',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ title: 'Нэвтрэх', presentation: 'modal' }} />
      <Stack.Screen name="(auth)/register" options={{ title: 'Бүртгүүлэх' }} />
      <Stack.Screen name="(auth)/forgot" options={{ title: 'Нууц үг сэргээх' }} />
      <Stack.Screen name="business/[id]" options={{ title: '' }} />
      <Stack.Screen name="book/[serviceId]" options={{ title: 'Цаг сонгох' }} />
      <Stack.Screen name="booking/[id]" options={{ title: 'Захиалгын дэлгэрэнгүй' }} />
      <Stack.Screen name="admin/business-form" options={{ title: 'Газар' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}
