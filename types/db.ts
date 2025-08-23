export type DrinkType =
  | 'beer'
  | 'wine'
  | 'spirits'
  | 'cocktail'
  | 'seltzer'
  | 'other';

export interface DrinkLog {
  id: string;
  user_id: string;
  type: DrinkType;
  quantity: number;
  unit: string;
  notes?: string | null;
  photo_url?: string | null;
  ai_confidence?: number | null;
  consumed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  type: DrinkType;
  standard_drinks: number;
  unit: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'created_at' | 'updated_at'>>;
      };
      drink_logs: {
        Row: DrinkLog;
        Insert: Omit<DrinkLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
        Update: Partial<
          Omit<DrinkLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>
        >;
      };
      drinks_catalog: {
        Row: CatalogItem;
        Insert: Omit<CatalogItem, 'id' | 'created_at'>;
        Update: Partial<Omit<CatalogItem, 'id' | 'created_at'>>;
      };
    };
  };
}
