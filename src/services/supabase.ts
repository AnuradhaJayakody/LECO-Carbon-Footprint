/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Supabase client instance (connects when environment variables are supplied)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConnected = !!supabase;
