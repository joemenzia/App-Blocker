import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Image, Modal, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createDrinkLog } from '@/lib/api';
import { UNITS } from '@/lib/stdDrink';

export default function ConfirmScreen() {
  const params = useLocalSearchParams();
  const TYPE_OPTIONS = ['beer','wine','spirits','cocktail','seltzer','other'] as const;
  const typeParam = (params.type as string) || '';
  const initialType = TYPE_OPTIONS.includes(typeParam as any) ? (typeParam as any) : 'beer';

  const unitParam = (params.unit as string) || '';
  const initialUnit = UNITS.includes(unitParam) ? unitParam : UNITS[0];

  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>(initialType);
  const [qty, setQty] = useState((params.qty as string) || '1');
  const [unit, setUnit] = useState<string>(initialUnit);
  const [loading, setLoading] = useState(false);

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [tempType, setTempType] = useState<(typeof TYPE_OPTIONS)[number]>(type || 'beer');
  const [tempUnit, setTempUnit] = useState<string>(unit || UNITS[0]);

  useEffect(() => {
    if (!type) {
      setType('beer');
    }
    if (!unit) {
      setUnit(UNITS[0]);
    }
  }, []);

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
        qty: parseFloat(qty),
        unit,
        std_drinks: parseFloat(qty), // temporary: 1 qty = 1 standard drink; refine later
        photo_path: (params.photo_url as string) || null,
        logged_at: new Date().toISOString(),
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
          <Pressable
            onPress={() => {
              setTempType(type || 'beer');
              setTypeModalVisible(true);
            }}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldText}>{type || 'beer'}</Text>
          </Pressable>

          <Input
            label="Quantity"
            placeholder="1"
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Unit</Text>
          <Pressable
            onPress={() => {
              setTempUnit(unit || UNITS[0]);
              setUnitModalVisible(true);
            }}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldText}>{unit || UNITS[0]}</Text>
          </Pressable>
        </Card>

        {/* Type Picker Modal */}
        <Modal
          visible={typeModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setTypeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Drink Type</Text>
              </View>
              <View style={styles.modalContent}>
                <Picker
                  selectedValue={tempType}
                  onValueChange={(v) => setTempType(v as (typeof TYPE_OPTIONS)[number])}
                  style={styles.modalPicker}
                >
                  <Picker.Item label="Beer" value="beer" />
                  <Picker.Item label="Wine" value="wine" />
                  <Picker.Item label="Spirits" value="spirits" />
                  <Picker.Item label="Cocktail" value="cocktail" />
                  <Picker.Item label="Seltzer" value="seltzer" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setTypeModalVisible(false)}
                />
                <Button
                  title="Done"
                  onPress={() => {
                    setType(tempType);
                    setTypeModalVisible(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Unit Picker Modal */}
        <Modal
          visible={unitModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setUnitModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Unit</Text>
              </View>
              <View style={styles.modalContent}>
                <Picker
                  selectedValue={tempUnit}
                  onValueChange={(v) => setTempUnit(v)}
                  style={styles.modalPicker}
                >
                  {UNITS.map((u) => (
                    <Picker.Item key={u} label={u} value={u} />
                  ))}
                </Picker>
              </View>
              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setUnitModalVisible(false)}
                />
                <Button
                  title="Done"
                  onPress={() => {
                    setUnit(tempUnit);
                    setUnitModalVisible(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

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
    height: 50,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
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
  fieldContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  fieldText: {
    fontSize: 16,
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 16,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    height: 200,
  },
  modalPicker: {
    height: 200,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
});
