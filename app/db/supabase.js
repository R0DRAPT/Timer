import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rohiacysyevtjzuxuqoy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaGlhY3lzeWV2dGp6dXh1cW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY1Mzc1NjYsImV4cCI6MjAzMjExMzU2Nn0.5gwj3pExBL2T8jZxONWW_R_1I4h1uEl4Tw8du0dE7TQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
