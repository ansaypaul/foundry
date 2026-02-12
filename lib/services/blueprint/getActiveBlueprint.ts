import { getSupabaseAdmin } from '@/lib/db/client';
import { BlueprintTemplateV1 } from './blueprintTemplateSchema';

// ====================================
// Get Active Blueprint for a Site
// ====================================

export interface ActiveBlueprintResult {
  exists: boolean;
  version: number | null;
  blueprintId: string | null;
  blueprint: BlueprintTemplateV1 | null;
}

/**
 * Load the active blueprint for a site
 * 1. Check sites.active_blueprint_version
 * 2. If set, load that version
 * 3. Else, load latest MAX(version)
 * 4. Return { version, blueprint_json }
 */
export async function getActiveBlueprint(
  siteId: string
): Promise<ActiveBlueprintResult> {
  const supabase = getSupabaseAdmin();

  // 1. Check active_blueprint_version on site
  const { data: siteData } = await supabase
    .from('sites')
    .select('active_blueprint_version')
    .eq('id', siteId)
    .single();

  let blueprintQuery = supabase
    .from('site_blueprint')
    .select('*')
    .eq('site_id', siteId);

  if (siteData?.active_blueprint_version) {
    // Load specific active version
    blueprintQuery = blueprintQuery.eq('version', siteData.active_blueprint_version);
  } else {
    // Fallback: load latest version
    blueprintQuery = blueprintQuery.order('version', { ascending: false }).limit(1);
  }

  const { data: blueprintRecord, error } = await blueprintQuery.maybeSingle();

  if (error || !blueprintRecord) {
    return {
      exists: false,
      version: null,
      blueprintId: null,
      blueprint: null,
    };
  }

  return {
    exists: true,
    version: blueprintRecord.version,
    blueprintId: blueprintRecord.id,
    blueprint: blueprintRecord.blueprint_json as BlueprintTemplateV1,
  };
}
