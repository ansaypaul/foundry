import { getSupabaseAdmin } from './client';

export async function getThemeById(themeId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('themes')
    .select('*')
    .eq('id', themeId)
    .single();
  
  return data;
}

export async function getAllThemes() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  return data || [];
}

export async function getThemeByKey(key: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('themes')
    .select('*')
    .eq('key', key)
    .single();
  
  return data;
}
