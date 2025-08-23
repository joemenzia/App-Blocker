import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { listLogs, getAggregate } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { DrinkLog } from '@/types/db';
import dayjs from 'dayjs';

type Range = 'day' | 'week' | 'month' | 'year';

export default function DashboardScreen() {
  const [selectedRange, setSelectedRange] = useState<Range>('day');

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['today-logs'],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      return listLogs({ from: startOfDay, to: endOfDay });
    },
  });

  // Commented out for now - will be used for history section later
  // const { data: allLogs = [] } = useQuery({
  //   queryKey: ['all-logs'],
  //   queryFn: () => listLogs({ limit: 100 }),
  // });

  const { data: chartData = [] } = useQuery({
    queryKey: ['chart-data', selectedRange],
    queryFn: () => getAggregate(selectedRange),
  });

  const handleEditLog = (log: DrinkLog) => {
    router.push({
      pathname: '/log/manual',
      params: { logId: JSON.stringify(log) },
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/splash');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const todayTotal = todayLogs.reduce((sum, log) => sum + log.std_drinks, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Button
            title="Logout"
            variant="outline"
            size="sm"
            onPress={handleLogout}
          />
        </View>

        {/* Range Selector */}
        <Card style={styles.rangeCard}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          <View style={styles.rangeButtons}>
            {(['day', 'week', 'month', 'year'] as Range[]).map((range) => (
              <Button
                key={range}
                title={range.charAt(0).toUpperCase() + range.slice(1)}
                variant={selectedRange === range ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setSelectedRange(range)}
                style={styles.rangeButton}
              />
            ))}
          </View>
        </Card>

        {/* Chart Placeholder */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Drinks Over Time</Text>
          <Text style={styles.chartPlaceholder}>
            Chart data: {chartData.length} points
          </Text>
        </Card>

        {/* Today's Logs */}
        <Card style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.sectionTitle}>Today</Text>
            <Text style={styles.totalText}>
              {todayTotal.toFixed(1)} std total
            </Text>
          </View>

          {todayLogs.length === 0 ? (
            <Text style={styles.emptyText}>No drinks logged today</Text>
          ) : (
            <View style={styles.logsList}>
              {todayLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logType}>{log.type}</Text>
                    <Text style={styles.logDetails}>
                      {log.qty} {log.unit} •{' '}
                      {dayjs(log.logged_at).format('h:mm A')}
                    </Text>
                  </View>
                  <View style={styles.logActions}>
                    <Text style={styles.logStd}>
                      {log.std_drinks.toFixed(1)} std
                    </Text>
                    <Button
                      title="Edit"
                      variant="outline"
                      size="sm"
                      onPress={() => handleEditLog(log)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <Button
            title="📸 Log New Drink"
            onPress={() => router.push('/')}
            size="lg"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rangeCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  rangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeButton: {
    flex: 1,
  },
  chartCard: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartPlaceholder: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 40,
  },
  todayCard: {
    marginBottom: 24,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 16,
  },
  logsList: {
    gap: 12,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontWeight: '500',
    color: '#111827',
    textTransform: 'capitalize',
  },
  logDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  logActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logStd: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  actions: {
    marginTop: 24,
  },
});
