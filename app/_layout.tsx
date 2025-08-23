// app/_layout.tsx
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View } from 'react-native';
import { queryClient } from '@/lib/queryClient';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function RootLayout() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size={48} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="index" />
            <Stack.Screen name="log" />
            <Stack.Screen name="dashboard/index" />
          </>
        ) : (
          <Stack.Screen name="(auth)/splash" />
        )}
      </Stack>
    </QueryClientProvider>
  );
}