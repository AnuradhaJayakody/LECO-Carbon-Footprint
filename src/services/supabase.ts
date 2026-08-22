import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!supabase;
export const configuredSupabaseUrl = supabaseUrl;

// Supabase Auth Integration
export async function signInWithSupabaseAuth(email: string, password?: string) {
  if (!supabase) {
    throw new Error('Supabase client is not configured with environment variables.');
  }
  const pwd = password || 'Sadmin@cf369';
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pwd
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signUpWithSupabaseAuth(email: string, password?: string, metadata?: any) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  const pwd = password || 'Sadmin@cf369';
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: pwd,
    options: {
      data: metadata
    }
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signOutSupabaseAuth() {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signout notice:', err);
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; error?: any }> {
  if (!supabase) {
    return { success: false, message: 'Supabase client is not configured with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  }
  try {
    const { data, error } = await supabase.from('facilities').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Connected to Supabase project, but tables are not created yet. Please execute the SQL Schema in your Supabase SQL Editor.', 
          error 
        };
      }
      return { success: false, message: `Database query error: ${error.message}`, error };
    }
    return { success: true, message: 'Successfully connected and verified tables in Supabase Postgres database!' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || err}`, error: err };
  }
}
