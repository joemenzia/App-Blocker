import { supabase } from './supabase';
import { DrinkLog, CatalogItem, DrinkType } from '@/types/db';

// Mock classifier for development
const MOCK_CLASSIFIER = {
  type: 'beer' as DrinkType,
  qty: 12,
  unit: 'oz',
  std_drinks: 1.0,
  confidence: 0.65,
  notes: 'Mock classification - replace with real AI',
};

export async function uploadPhotoAsync(
  localUri: string
): Promise<{ path: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Object key inside the bucket: <userId>/<timestamp>.jpg
  const path = `${user.id}/${Date.now()}.jpg`;

  // RN-friendly File-like object supported by supabase-js in React Native
  const file = {
    uri: localUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any;

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;
  return { path };
}

export async function classifyPhoto(path: string): Promise<{
  type: DrinkType;
  qty: number;
  unit: string;
  std_drinks: number;
  confidence: number;
  notes?: string;
}> {
  // Check if classifier is disabled or not available
  if (process.env.CLASSIFIER_DISABLED === 'true') {
    return MOCK_CLASSIFIER;
  }

  try {
    const { data, error } = await supabase.functions.invoke('classify-drink', {
      body: { path },
    });

    if (error) {
      console.warn('Classifier not available, using mock:', error);
      return MOCK_CLASSIFIER;
    }

    return data;
  } catch (error) {
    console.warn('Classifier error, using mock:', error);
    return MOCK_CLASSIFIER;
  }
}

export async function createDrinkLog(
  input: Omit<DrinkLog, 'id' | 'user_id'>
): Promise<DrinkLog> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('drink_logs')
    .insert({
      user_id: user.id,
      ...input,
    } as any)
    .select('*')
    .single();

  if (error) throw error;
  return data as DrinkLog;
}

export async function updateDrinkLog(
  id: string,
  patch: Partial<DrinkLog>
): Promise<DrinkLog> {
  const { data, error } = await supabase
    .from('drink_logs')
    .update(patch as any)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as DrinkLog;
}

export async function listLogs({
  from,
  to,
  limit = 50,
  offset = 0,
}: {
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
} = {}): Promise<DrinkLog[]> {
  let query = supabase
    .from('drink_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) {
    query = query.gte('logged_at', from.toISOString());
  }
  if (to) {
    query = query.lte('logged_at', to.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as DrinkLog[];
}

export async function getDailyTotal(date: Date): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const logs = await listLogs({ from: startOfDay, to: endOfDay });
  return logs.reduce((total, log) => total + log.std_drinks, 0);
}

export async function getAggregate(
  range: 'day' | 'week' | 'month' | 'year'
): Promise<Array<{ x: string; y: number }>> {
  const now = new Date();
  const results: Array<{ x: string; y: number }> = [];

  switch (range) {
    case 'day':
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const total = await getDailyTotal(date);
        results.push({
          x: date.toISOString().split('T')[0],
          y: total,
        });
      }
      break;
    case 'week':
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(
          startOfWeek.getDate() - (startOfWeek.getDay() + 7 * i)
        );
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const logs = await listLogs({ from: startOfWeek, to: endOfWeek });
        const total = logs.reduce((sum, log) => sum + log.std_drinks, 0);

        results.push({
          x: startOfWeek.toISOString().split('T')[0],
          y: total,
        });
      }
      break;
    case 'month':
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59,
          999
        );

        const logs = await listLogs({ from: startOfMonth, to: endOfMonth });
        const total = logs.reduce((sum, log) => sum + log.std_drinks, 0);

        results.push({
          x: startOfMonth.toISOString().slice(0, 7), // YYYY-MM format
          y: total,
        });
      }
      break;
    case 'year':
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59,
          999
        );

        const logs = await listLogs({ from: startOfMonth, to: endOfMonth });
        const total = logs.reduce((sum, log) => sum + log.std_drinks, 0);

        results.push({
          x: startOfMonth.toISOString().slice(0, 7), // YYYY-MM format
          y: total,
        });
      }
      break;
  }

  return results;
}

export async function searchDrinksCatalog(
  query: string
): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('drinks_catalog')
    .select('*')
    .ilike('label', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return (data || []) as CatalogItem[];
}
