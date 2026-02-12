import { NextRequest, NextResponse } from 'next/server';
import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getActiveBlueprint } from '@/lib/services/blueprint/getActiveBlueprint';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get preview of taxonomy plan FROM ACTIVE BLUEPRINT
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

    // Desired categories from blueprint
    const desiredCategories = blueprint.taxonomy.categories;

    // Get existing categories from DB
    const supabase = getSupabaseAdmin();
    const { data: existingCategories } = await supabase
      .from('terms')
      .select('slug')
      .eq('site_id', id)
      .eq('type', 'category');

    const existingSlugs = (existingCategories || []).map(c => c.slug);

    // Compute missing (diff)
    const missingCategories = desiredCategories.filter(
      cat => !existingSlugs.includes(cat.slug)
    );

    return NextResponse.json({
      source: `Blueprint v${version}`,
      blueprintVersion: version,
      profile: {
        siteSize: blueprint.site.ambitionLevel,
        targetCount: desiredCategories.length,
      },
      plan: desiredCategories,
      existingCount: existingSlugs.length,
      missingCategories,
    });
  } catch (error) {
    console.error('Error generating taxonomy preview:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du plan' },
      { status: 500 }
    );
  }
}

// POST: Apply taxonomy plan FROM ACTIVE BLUEPRINT
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

    const { blueprint } = blueprintResult;
    const desiredCategories = blueprint.taxonomy.categories;

    const supabase = getSupabaseAdmin();

    // Get existing categories
    const { data: existingCategories } = await supabase
      .from('terms')
      .select('slug')
      .eq('site_id', id)
      .eq('type', 'category');

    const existingSlugs = (existingCategories || []).map(c => c.slug);

    // Filter to only missing
    const missingCategories = desiredCategories.filter(
      cat => !existingSlugs.includes(cat.slug)
    );

    if (missingCategories.length === 0) {
      return NextResponse.json({
        message: 'Toutes les catégories existent déjà',
        created: 0,
      });
    }

    // Create missing categories
    const categoriesToCreate = missingCategories.map(cat => ({
      site_id: id,
      name: cat.name,
      slug: cat.slug,
      type: 'category',
      description: null, // Will be enriched later
      status: 'active',
    }));

    const { data: createdCategories, error } = await supabase
      .from('terms')
      .insert(categoriesToCreate)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: `${createdCategories?.length || 0} catégorie(s) créée(s) avec succès`,
      created: createdCategories?.length || 0,
      categories: createdCategories,
    });
  } catch (error) {
    console.error('Error applying taxonomy plan:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des catégories' },
      { status: 500 }
    );
  }
}
