import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { searchDrinksCatalog, createDrinkLog, updateDrinkLog } from '@/lib/api';
import { estimateStd, UNITS } from '@/lib/stdDrink';
import { DrinkLog, CatalogItem, DrinkType } from '@/types/db';
import { useQuery } from '@tanstack/react-query';

export default function ManualLogScreen() {
  const params = useLocalSearchParams();
  const editingLog = params.logId
    ? (JSON.parse(params.logId as string) as DrinkLog)
    : null;

  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const [_selectedDrink, setSelectedDrink] = useState<CatalogItem | null>(null);
  const [type, setType] = useState<DrinkType>('beer');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('oz');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form if editing
  useEffect(() => {
    if (editingLog) {
      setType(editingLog.type);
      setQty(editingLog.qty.toString());
      setUnit(editingLog.unit);
      setNotes(editingLog.notes || '');
    }
  }, [editingLog]);

  const { data: searchResults = [] } = useQuery({
    queryKey: ['drinks-search', searchQuery],
    queryFn: () => searchDrinksCatalog(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const handleDrinkSelect = (drink: CatalogItem) => {
    setSelectedDrink(drink);
    setType(drink.category);
    setQty(drink.default_qty.toString());
    setUnit(drink.default_unit);
    setSearchQuery(drink.label);
  };

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
        notes: notes.trim() || null,
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

  const renderSearchResult = ({ item }: { item: CatalogItem }) => (
    <TouchableOpacity
      onPress={() => handleDrinkSelect(item)}
      style={styles.searchResult}
    >
      <Text style={styles.searchResultTitle}>{item.label}</Text>
      <Text style={styles.searchResultSubtitle}>
        {item.default_qty} {item.default_unit} • {item.default_std} std
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>
          {editingLog ? 'Edit Drink' : 'Log Drink Manually'}
        </Text>

        <Input
          label="Search Drinks"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for a drink type..."
        />

        {searchQuery.length > 0 && searchResults.length > 0 && (
          <Card style={styles.searchResults}>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drink Type</Text>
          <View style={styles.typeButtons}>
            {(
              [
                'beer',
                'wine',
                'spirits',
                'cocktail',
                'seltzer',
                'other',
              ] as DrinkType[]
            ).map((drinkType) => (
              <TouchableOpacity
                key={drinkType}
                onPress={() => setType(drinkType)}
                style={[
                  styles.typeButton,
                  type === drinkType && styles.typeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === drinkType && styles.typeButtonTextActive,
                  ]}
                >
                  {drinkType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              label="Quantity"
              value={qty}
              onChangeText={setQty}
              placeholder="12"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.sectionTitle}>Unit</Text>
            <View style={styles.unitButtons}>
              {UNITS.map((unitOption) => (
                <TouchableOpacity
                  key={unitOption}
                  onPress={() => setUnit(unitOption)}
                  style={[
                    styles.unitButton,
                    unit === unitOption && styles.unitButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      unit === unitOption && styles.unitButtonTextActive,
                    ]}
                  >
                    {unitOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Input
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
        />

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
      </Card>
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
  searchResults: {
    marginBottom: 16,
    maxHeight: 160,
  },
  searchResult: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultTitle: {
    fontWeight: '500',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#6b7280',
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  typeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    textTransform: 'capitalize',
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  unitButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  unitButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  unitButtonText: {
    color: '#374151',
  },
  unitButtonTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
});
