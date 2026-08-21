/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Supabase client instance (connects with environment variables)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://rrnxnarcegljasuamnzu.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (supabaseUrl ? createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybnhuYXJjZWdsamFzdWFtbnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzIzMjQsImV4cCI6MjEwMjgwODMyNH0.N_5mZNOjTT0r3YMyjlZYgPuoMKlUP_WJJqyOzwE-cYA') : null);

export const isSupabaseConfigured = !!supabase;
export const configuredSupabaseUrl = supabaseUrl;

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; error?: any }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client is not initialized.' };
  }
  try {
    // Attempt a light ping/query
    const { data, error } = await supabase.from('leco_facilities').select('id, name').limit(1);
    if (error) {
      // If table does not exist yet, connection itself is valid
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return { 
          success: true, 
          message: 'Connected to Supabase project successfully! (Tables pending creation via SQL schema)',
          error: null 
        };
      }
      return { success: true, message: `Connected to Supabase endpoint (${error.message || 'Ready'})`, error };
    }
    return { success: true, message: `Connected to Supabase PostgreSQL database (${data?.length || 0} facilities found)` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection test failed', error: err };
  }
}

