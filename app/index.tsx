import React, { useState, useRef } from 'react';
import { useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { uploadPhotoAsync, classifyPhoto } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function MainScreen() {
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/splash');
      }
    };
    checkAuth();
  }, []);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const ensureSignedIn = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert(
          'Sign in required',
          'Please sign in to log drinks.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/splash') }]
        );
        return false;
      }
      return true;
    } catch (e) {
      Alert.alert('Sign in required', 'Please sign in to continue.');
      router.replace('/(auth)/splash');
      return false;
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const cam = await requestPermission();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const ok = (cam?.granted ?? false) && libraryStatus === 'granted';
      setHasPermission(ok);
      if (!ok) {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access is required to log drinks.'
        );
      }
      return ok;
    } catch (error) {
      console.log('Permission request failed:', error);
      setHasPermission(false);
      return false;
    }
  };

  const handleCameraCapture = async () => {
    if (!(await ensureSignedIn())) return;
    const ok = await requestPermissions();
    if (!ok) return;
    setCameraVisible(true);
  };

  const handlePhotoCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
        setCameraVisible(false);
        await processPhoto(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handlePhotoPicker = async () => {
    if (!(await ensureSignedIn())) return;
    const ok = await requestPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processPhoto(result.assets[0].uri);
    }
  };

  const processPhoto = async (uri: string) => {
    try {
      const { path } = await uploadPhotoAsync(uri);
      const classification = await classifyPhoto(path);

      router.push({
        pathname: '/log/confirm',
        params: {
          path,
          type: classification.type,
          qty: classification.qty.toString(),
          unit: classification.unit,
          std_drinks: classification.std_drinks.toString(),
          confidence: classification.confidence.toString(),
          notes: classification.notes || '',
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (cameraVisible) {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing={'back'}>
          <View style={styles.cameraControls}>
            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setCameraVisible(false)}
              />
              <Button
                title="Take Photo"
                variant="primary"
                onPress={handlePhotoCapture}
              />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Log Your Drink</Text>

          <Button
            title="📸 Open Camera"
            onPress={handleCameraCapture}
            size="lg"
            style={styles.mainButton}
          />

          <View style={styles.buttonGroup}>
            <Button
              title="📁 Choose from Photos"
              variant="outline"
              onPress={handlePhotoPicker}
              style={styles.secondaryButton}
            />

            <Button
              title="✏️ Log Manually"
              variant="outline"
              onPress={async () => {
                if (!(await ensureSignedIn())) return;
                router.push('/log/manual');
              }}
              style={styles.secondaryButton}
            />
          </View>
        </Card>
      </View>

      <Button
        title="📊 Dashboard"
        variant="secondary"
        onPress={async () => {
          if (!(await ensureSignedIn())) return;
          router.push('/dashboard');
        }}
        style={styles.dashboardButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  mainButton: {
    marginBottom: 24,
  },
  buttonGroup: {
    gap: 12,
  },
  secondaryButton: {
    marginBottom: 8,
  },
  dashboardButton: {
    marginBottom: 24,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
});
