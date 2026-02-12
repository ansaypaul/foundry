import { NextRequest, NextResponse } from 'next/server';
import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getActiveBlueprint } from '@/lib/services/blueprint/getActiveBlueprint';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get preview of pages plan FROM ACTIVE BLUEPRINT
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

    // Desired pages from blueprint
    const desiredPages = blueprint.pages;

    // Get existing pages from DB
    const supabase = getSupabaseAdmin();
    const { data: existingPages } = await supabase
      .from('content')
      .select('slug')
      .eq('site_id', id)
      .eq('type', 'page');

    const existingSlugs = (existingPages || []).map(p => p.slug);

    // Compute missing (diff)
    const missingPages = desiredPages.filter(
      page => !existingSlugs.includes(page.slug)
    );

    return NextResponse.json({
      source: `Blueprint v${version}`,
      blueprintVersion: version,
      profile: {
        siteSize: blueprint.site.ambitionLevel,
        targetCount: desiredPages.length,
      },
      plan: desiredPages,
      existingCount: existingSlugs.length,
      missingPages,
    });
  } catch (error) {
    console.error('Error generating pages preview:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du plan' },
      { status: 500 }
    );
  }
}

// POST: Apply pages plan FROM ACTIVE BLUEPRINT
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
    const desiredPages = blueprint.pages;

    const supabase = getSupabaseAdmin();

    // Get existing pages
    const { data: existingPages } = await supabase
      .from('content')
      .select('slug')
      .eq('site_id', id)
      .eq('type', 'page');

    const existingSlugs = (existingPages || []).map(p => p.slug);

    // Filter to only missing
    const missingPages = desiredPages.filter(
      page => !existingSlugs.includes(page.slug)
    );

    if (missingPages.length === 0) {
      return NextResponse.json({
        message: 'Toutes les pages existent déjà',
        created: 0,
      });
    }

    // Create missing pages
    const pagesToCreate = missingPages.map(page => ({
      site_id: id,
      title: page.title,
      slug: page.slug,
      type: 'page',
      page_type: page.key,
      status: 'draft',
      content_html: null, // Will be enriched later
      author_id: null,
    }));

    const { data: createdPages, error } = await supabase
      .from('content')
      .insert(pagesToCreate)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: `${createdPages?.length || 0} page(s) créée(s) avec succès`,
      created: createdPages?.length || 0,
      pages: createdPages,
    });
  } catch (error) {
    console.error('Error applying pages plan:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des pages' },
      { status: 500 }
    );
  }
}
