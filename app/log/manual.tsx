import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { createDrinkLog, updateDrinkLog } from '@/lib/api';
import { estimateStd, UNITS } from '@/lib/stdDrink';
import { DrinkLog, DrinkType } from '@/types/db';

const TYPE_OPTIONS = ['beer','wine','spirits','cocktail','seltzer','other'] as const;

export default function ManualLogScreen() {
  const params = useLocalSearchParams();
  const editingLog = useMemo<DrinkLog | null>(() => {
    try {
      return params?.logId ? (JSON.parse(params.logId as string) as DrinkLog) : null;
    } catch {
      return null;
    }
  }, [params?.logId]);

  const [type, setType] = useState<DrinkType>(editingLog?.type ?? 'beer');
  const [qty, setQty] = useState(editingLog ? String(editingLog.qty) : '1');
  const [unit, setUnit] = useState(editingLog?.unit ?? 'oz');
  const [loading, setLoading] = useState(false);

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [tempType, setTempType] = useState<DrinkType>(type || 'beer');
  const [tempUnit, setTempUnit] = useState<string>(unit || UNITS[0]);



  const handleSave = async () => {
    if (!qty || parseFloat(qty) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const std_drinks = estimateStd({
        type,
        qty: parseFloat(qty),
        unit: unit as any,
      });

      const logData = {
        logged_at: new Date().toISOString(),
        type,
        qty: parseFloat(qty),
        unit,
        std_drinks,
      };

      if (editingLog) {
        await updateDrinkLog(editingLog.id, logData);
      } else {
        await createDrinkLog(logData);
      }

      router.push('/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card} pointerEvents="box-none">
        <Text style={styles.title}>
          {editingLog ? 'Edit Drink' : 'Log Drink Manually'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drink Type</Text>
          <Pressable
            onPress={() => {
              setTempType(type || 'beer');
              setTypeModalVisible(true);
            }}
            style={styles.fieldContainer}
          >
            <Text style={styles.fieldText}>{type || 'beer'}</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <TextInput
              value={qty}
              onFocus={() => {
                console.log('[Manual] Quantity focus');
              }}
              onChangeText={(t) => {
                console.log('[Manual] onChangeText raw:', t);
                const cleaned = t.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                const parts = cleaned.split('.');
                const normalized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                console.log('[Manual] qty ->', normalized);
                setQty(normalized);
              }}
              placeholder="12"
              keyboardType="decimal-pad"
              inputMode="decimal"
              style={styles.textInput}
              returnKeyType="done"
              editable
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.sectionTitle}>Unit</Text>
            <Pressable
              onPress={() => {
                setTempUnit(unit || UNITS[0]);
                setUnitModalVisible(true);
              }}
              style={styles.fieldContainer}
            >
              <Text style={styles.fieldText}>{unit || UNITS[0]}</Text>
            </Pressable>
          </View>
        </View>

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
                  onValueChange={(v) => setTempType(v as DrinkType)}
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
                <Pressable style={styles.modalBtnOutline} onPress={() => setTypeModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalBtn}
                  onPress={() => {
                    setType(tempType);
                    setTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalBtnTextPrimary}>Done</Text>
                </Pressable>
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
                <Pressable style={styles.modalBtnOutline} onPress={() => setUnitModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalBtn}
                  onPress={() => {
                    setUnit(tempUnit);
                    setUnitModalVisible(false);
                  }}
                >
                  <Text style={styles.modalBtnTextPrimary}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Button
          title={editingLog ? 'Save Changes' : 'Log Drink'}
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />

        <Button
          title="Cancel"
          variant="outline"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  card: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
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
  modalBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnOutline: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  modalBtnText: {
    fontSize: 16,
    color: '#111827',
  },
  modalBtnTextPrimary: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
});
