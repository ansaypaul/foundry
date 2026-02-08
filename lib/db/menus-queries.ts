import { getSupabaseAdmin } from '@/lib/db/client';

/**
 * Menus queries
 */

export async function getMenusBySiteId(siteId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('site_id', siteId)
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function getMenuById(menuId: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('id', menuId)
    .single();

  if (error) throw error;
  return data;
}

export async function getMenuByLocation(siteId: string, location: string) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('site_id', siteId)
    .eq('location', location)
    .single();

  if (error) return null;
  return data;
}

export async function createMenu(menu: any) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('menus')
    .insert(menu as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMenu(menuId: string, updates: any) {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('menus')
    .update(updates as any)
    .eq('id', menuId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMenu(menuId: string) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', menuId);

  if (error) throw error;
}
