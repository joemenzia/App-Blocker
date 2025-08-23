import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createDrinkLog } from '@/lib/api';
import { UNITS } from '@/lib/stdDrink';

export default function ConfirmScreen() {
  const params = useLocalSearchParams();
  const [type, setType] = useState((params.type as string) || 'beer');
  const [qty, setQty] = useState((params.qty as string) || '1');
  const [unit, setUnit] = useState((params.unit as string) || 'bottle');
  const [notes, setNotes] = useState((params.notes as string) || '');
  const [loading, setLoading] = useState(false);

  const confidence = parseFloat((params.confidence as string) || '0.8');

  const handleSave = async () => {
    if (!qty || parseFloat(qty) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      await createDrinkLog({
        type: type as any,
        quantity: parseFloat(qty),
        unit,
        notes: notes.trim() || null,
        photo_url: (params.photo_url as string) || null,
        ai_confidence: confidence,
        consumed_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Drink logged successfully!', [
        { text: 'OK', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirm Drink Details</Text>

        {params.photo_url && (
          <Card style={styles.imageCard}>
            <Image
              source={{ uri: params.photo_url as string }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.confidence}>
              AI Confidence: {(confidence * 100).toFixed(1)}%
            </Text>
          </Card>
        )}

        <Card>
          <Text style={styles.label}>Drink Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={setType}
              style={styles.picker}
            >
              <Picker.Item label="Beer" value="beer" />
              <Picker.Item label="Wine" value="wine" />
              <Picker.Item label="Spirits" value="spirits" />
              <Picker.Item label="Cocktail" value="cocktail" />
              <Picker.Item label="Seltzer" value="seltzer" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>

          <Input
            label="Quantity"
            placeholder="1"
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Unit</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={unit}
              onValueChange={setUnit}
              style={styles.picker}
            >
              {UNITS.map((u) => (
                <Picker.Item key={u} label={u} value={u} />
              ))}
            </Picker>
          </View>

          <Input
            label="Notes (optional)"
            placeholder="Add any notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Drink"
            onPress={handleSave}
            disabled={loading}
            style={styles.saveButton}
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  imageCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  confidence: {
    fontSize: 14,
    color: '#6B7280',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 16,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {},
});
