import { NextRequest, NextResponse } from 'next/server';
import { getSiteById } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getActiveBlueprint } from '@/lib/services/blueprint/getActiveBlueprint';
import { generateAuthorSlug } from '@/lib/services/setup/authorsGenerator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get preview of authors plan FROM ACTIVE BLUEPRINT
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

    // Desired authors from blueprint
    const desiredAuthors = blueprint.authors;

    // Get existing authors from DB
    const supabase = getSupabaseAdmin();
    const { data: existingAuthors } = await supabase
      .from('authors')
      .select('role_key')
      .eq('site_id', id);

    const existingRoleKeys = (existingAuthors || []).map(a => a.role_key).filter(Boolean);

    // Compute missing (diff)
    const missingAuthors = desiredAuthors.filter(
      author => !existingRoleKeys.includes(author.roleKey)
    );

    return NextResponse.json({
      source: `Blueprint v${version}`,
      blueprintVersion: version,
      profile: {
        siteSize: blueprint.site.ambitionLevel,
        velocity: 'N/A',
        targetCount: desiredAuthors.length,
      },
      plan: desiredAuthors,
      existingCount: existingRoleKeys.length,
      missingAuthors,
    });
  } catch (error) {
    console.error('Error generating authors preview:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du plan' },
      { status: 500 }
    );
  }
}

// POST: Apply authors plan FROM ACTIVE BLUEPRINT
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
    const desiredAuthors = blueprint.authors;

    const supabase = getSupabaseAdmin();

    // Get existing authors
    const { data: existingAuthors } = await supabase
      .from('authors')
      .select('role_key')
      .eq('site_id', id);

    const existingRoleKeys = (existingAuthors || []).map(a => a.role_key).filter(Boolean);

    // Filter to only missing
    const missingAuthors = desiredAuthors.filter(
      author => !existingRoleKeys.includes(author.roleKey)
    );

    if (missingAuthors.length === 0) {
      return NextResponse.json({
        message: 'Tous les auteurs existent déjà',
        created: 0,
      });
    }

    // Create missing authors
    const authorsToCreate = missingAuthors.map(author => ({
      site_id: id,
      slug: generateAuthorSlug(author.displayName),
      display_name: author.displayName,
      role_key: author.roleKey,
      specialties: author.specialties,
      is_ai: author.isAi,
      status: 'active',
      bio: null, // Will be enriched later
    }));

    const { data: createdAuthors, error } = await supabase
      .from('authors')
      .insert(authorsToCreate)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: `${createdAuthors?.length || 0} auteur(s) créé(s) avec succès`,
      created: createdAuthors?.length || 0,
      authors: createdAuthors,
    });
  } catch (error) {
    console.error('Error applying authors plan:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des auteurs' },
      { status: 500 }
    );
  }
}
