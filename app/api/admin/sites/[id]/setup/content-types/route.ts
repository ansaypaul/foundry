import { NextRequest, NextResponse } from 'next/server';
import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getActiveBlueprint } from '@/lib/services/blueprint/getActiveBlueprint';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get preview of content types plan FROM ACTIVE BLUEPRINT
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const site = await getSiteById(id);

    if (!site) {
      return NextResponse.json({ error: 'Site non trouvé' }, { status: 404 });
    }

    // Load active blueprint
    const blueprintResult = await getActiveBlueprint(id);

    if (!blueprintResult.exists || !blueprintResult.blueprint) {
      return NextResponse.json({
        error: 'Aucun blueprint actif. Générez d\'abord un blueprint.',
        noBlueprintFound: true,
      }, { status: 404 });
    }

    const { blueprint, version } = blueprintResult;

    // Get desired content types from editorial_content_types table
    const supabase = getSupabaseAdmin();
    const { data: editorialContentTypes } = await supabase
      .from('editorial_content_types')
      .select('*')
      .order('key');

    // Get existing content types for this site from DB
    const { data: existingContentTypes } = await supabase
      .from('content_types')
      .select('key')
      .eq('site_id', id);

    const existingKeys = (existingContentTypes || []).map(ct => ct.key);
    const desiredContentTypes = editorialContentTypes || [];

    // Compute missing (diff)
    const missingContentTypes = desiredContentTypes.filter(
      ct => !existingKeys.includes(ct.key)
    );

    return NextResponse.json({
      source: `Blueprint v${version}`,
      blueprintVersion: version,
      profile: {
        siteSize: blueprint.site.ambitionLevel,
        targetCount: desiredContentTypes.length,
      },
      plan: desiredContentTypes,
      existingCount: existingKeys.length,
      missingContentTypes,
    });
  } catch (error) {
    console.error('Error generating content types preview:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du plan' },
      { status: 500 }
    );
  }
}

// POST: Apply content types plan FROM ACTIVE BLUEPRINT
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const site = await getSiteById(id);

    if (!site) {
      return NextResponse.json({ error: 'Site non trouvé' }, { status: 404 });
    }

    // Load active blueprint
    const blueprintResult = await getActiveBlueprint(id);

    if (!blueprintResult.exists || !blueprintResult.blueprint) {
      return NextResponse.json({
        error: 'Aucun blueprint actif. Générez d\'abord un blueprint.',
      }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();

    // Get desired content types from editorial_content_types table
    const { data: editorialContentTypes } = await supabase
      .from('editorial_content_types')
      .select('*')
      .order('key');

    const desiredContentTypes = editorialContentTypes || [];

    // Get existing content types
    const { data: existingContentTypes } = await supabase
      .from('content_types')
      .select('key')
      .eq('site_id', id);

    const existingKeys = (existingContentTypes || []).map(ct => ct.key);

    // Filter to only missing
    const missingContentTypes = desiredContentTypes.filter(
      ct => !existingKeys.includes(ct.key)
    );

    if (missingContentTypes.length === 0) {
      return NextResponse.json({
        message: 'Tous les types de contenu existent déjà',
        created: 0,
      });
    }

    // Create missing content types
    const contentTypesToCreate = missingContentTypes.map(ct => ({
      site_id: id,
      key: ct.key,
      label: ct.label,
      rules_json: ct.rules_json,
      status: 'active',
    }));

    const { data: createdContentTypes, error } = await supabase
      .from('content_types')
      .insert(contentTypesToCreate)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: `${createdContentTypes?.length || 0} type(s) de contenu créé(s) avec succès`,
      created: createdContentTypes?.length || 0,
      contentTypes: createdContentTypes,
    });
  } catch (error) {
    console.error('Error applying content types plan:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des types de contenu' },
      { status: 500 }
    );
  }
}
