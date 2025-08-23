import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthUser } from '@/hooks/useAuthUser';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        {user ? (
          <>
            <Stack.Screen
              name="index"
              options={{
                title: 'Alcohol Tracker',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="log"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="dashboard"
              options={{
                title: 'Dashboard',
                headerShown: false,
              }}
            />
          </>
        ) : (
          <Stack.Screen
            name="(auth)/splash"
            options={{
              headerShown: false,
            }}
          />
        )}
      </Stack>
    </QueryClientProvider>
  );
}
