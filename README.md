# Alcohol Intake Tracker

A React Native/Expo app for tracking alcohol consumption with AI-powered drink classification.

## Features

- 📸 **Camera & Photo Logging**: Take photos or select from gallery
- 🤖 **AI Classification**: Automatic drink type and quantity detection (mock for now)
- 📊 **Dashboard**: Charts and analytics with time range selection
- 📝 **Manual Logging**: Search drinks catalog and manual entry
- 📱 **Cross-platform**: iOS and Android support
- 🔐 **Authentication**: Supabase Auth with email/password
- 📈 **Analytics**: Standard drink calculations and trends

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development)
- Supabase account

### Installation

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Fill in your Supabase credentials:

   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Run the app**

   ```bash
   npm run dev
   # or
   npx expo start -c
   ```

4. **Open in simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Supabase Setup

### 1. Create a new Supabase project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Set up the database

Run this SQL in your Supabase SQL editor:

```sql
-- profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- drink_logs table
create table if not exists drink_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  type text not null,
  qty numeric not null,
  unit text not null,
  std_drinks numeric not null,
  confidence numeric,
  photo_path text,
  notes text
);

-- drinks_catalog table
create table if not exists drinks_catalog (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null,
  default_unit text not null,
  default_qty numeric not null,
  default_std numeric not null
);

-- Seed drinks catalog
insert into drinks_catalog(label,category,default_unit,default_qty,default_std) values
  ('beer','beer','oz',12,1.0),
  ('pint lager','beer','pint',1,1.4),
  ('wine (red)','wine','glass',1,1.0),
  ('shot vodka','spirits','shot',1,1.0),
  ('old fashioned','cocktail','glass',1,1.5),
  ('margarita','cocktail','glass',1,1.5)
on conflict do nothing;

-- Enable RLS
alter table drink_logs enable row level security;
create policy "own logs" on drink_logs
  for all using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- Enable RLS on profiles
alter table profiles enable row level security;
create policy "own profile" on profiles
  for all using ( auth.uid() = id ) with check ( auth.uid() = id );

-- Enable RLS on drinks_catalog (read-only for all auth users)
alter table drinks_catalog enable row level security;
create policy "read catalog" on drinks_catalog
  for select using ( auth.role() = 'authenticated' );
```

### 3. Create storage bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `drinks`
3. Set it to public (for MVP) or private with signed URLs

### 4. Configure authentication

1. Go to Authentication > Settings
2. Enable email confirmations (optional for development)
3. Configure any additional auth providers as needed

## AI Classification (Optional)

The app includes a mock classifier for development. To enable real AI classification:

1. Create a Supabase Edge Function called `classify-drink`
2. The function should accept `{ path }` and return:

   ```json
   {
     "type": "beer",
     "qty": 12,
     "unit": "oz",
     "std_drinks": 1.0,
     "confidence": 0.85,
     "notes": "Detected beer bottle"
   }
   ```

3. Set `CLASSIFIER_DISABLED=false` in your environment to enable real classification

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run build:ios` - Build for iOS production

### Project Structure

```
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── log/               # Logging screens
│   ├── dashboard/         # Dashboard screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── charts/           # Chart components
│   └── HistoryList.tsx   # History list component
├── lib/                  # Utility libraries
│   ├── api.ts           # API functions
│   ├── supabase.ts      # Supabase client
│   ├── stdDrink.ts      # Standard drink calculations
│   └── utils.ts         # Utility functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── styles/              # Styling configuration
```

### Key Technologies

- **Expo Router** - File-based navigation
- **Supabase** - Backend (Auth, Database, Storage)
- **React Query** - Data fetching and caching
- **Victory Native** - Charts and analytics
- **NativeWind** - Tailwind CSS for React Native
- **Expo Camera/ImagePicker** - Photo capture and selection

## Testing the App

1. **Authentication Flow**
   - App starts at splash screen
   - Sign up with email/password
   - Verify email (if enabled)
   - Sign in to access main app

2. **Photo Logging**
   - Tap "Open Camera" → take photo → AI classification → confirm → save
   - Tap "Choose from Photos" → select photo → same flow
   - Mock classifier returns beer/12oz/1.0 std drink

3. **Manual Logging**
   - Tap "Log Manually" → search drinks → select → fill quantity/unit → save
   - Edit existing logs from dashboard

4. **Dashboard**
   - View charts with different time ranges
   - See today's logs with edit buttons
   - Expand/collapse history
   - Logout functionality

## Troubleshooting

### Common Issues

1. **Metro bundler issues**

   ```bash
   npx expo start -c
   ```

2. **TypeScript errors**

   ```bash
   npm run typecheck
   ```

3. **Supabase connection issues**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are correct

4. **Camera permissions**
   - iOS: Check Info.plist permissions
   - Android: Check AndroidManifest.xml

### Environment Variables

Required:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

Optional:

- `CLASSIFIER_DISABLED` - Set to "true" to use mock classifier

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details


