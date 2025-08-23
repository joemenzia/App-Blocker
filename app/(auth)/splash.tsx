import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Splash() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password: passwordTrimmed,
        });
        if (error) throw error;

        if (!data.session) {
          Alert.alert('Check your email', 'We sent you a confirmation link.');
        } else {
          router.replace('/');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password: passwordTrimmed,
        });
        if (error) throw error;
        router.replace('/');
      }
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Authentication failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={64}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>{isSignUp ? 'Create an account' : 'Sign in to continue'}</Text>

        <View style={{ width: '100%', gap: 12 }}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={{ height: 12 }} />

        <Button title={isSignUp ? 'Sign Up' : 'Sign In'} onPress={handleAuth} loading={loading} />

        <View style={{ height: 12 }} />

        <Button
          title={isSignUp ? 'Have an account? Sign In' : "New here? Create account"}
          variant="ghost"
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
});
