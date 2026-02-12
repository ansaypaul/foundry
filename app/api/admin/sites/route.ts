import { NextRequest, NextResponse } from 'next/server';
import { createSite, getAllSites } from '@/lib/db/queries';
import { getSupabaseAdmin } from '@/lib/db/client';

export async function GET() {
  try {
    const sites = await getAllSites();
    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      theme_id = null, 
      status = 'active',
      language = 'en',
      country = 'US',
      site_type = 'niche_passion',
      automation_level = 'manual',
      ambition_level = 'auto',
      description = null,
      setup_status = 'draft',
    } = body;

    // Validation - name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du site est requis' },
        { status: 400 }
      );
    }

    // Validation - language
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { error: 'La langue est requise' },
        { status: 400 }
      );
    }

    // Validation - country
    if (!country || typeof country !== 'string') {
      return NextResponse.json(
        { error: 'Le pays est requis' },
        { status: 400 }
      );
    }

    // Validation - site_type
    const validSiteTypes = ['niche_passion', 'news_media', 'gaming_popculture', 'affiliate_guides', 'lifestyle'];
    if (!validSiteTypes.includes(site_type)) {
      return NextResponse.json(
        { error: 'Type de site invalide' },
        { status: 400 }
      );
    }

    // Validation - automation_level
    const validAutomationLevels = ['manual', 'ai_assisted', 'ai_auto'];
    if (!validAutomationLevels.includes(automation_level)) {
      return NextResponse.json(
        { error: 'Niveau d\'automatisation invalide' },
        { status: 400 }
      );
    }

    // Validation - ambition_level
    const validAmbitionLevels = ['auto', 'starter', 'growth', 'factory'];
    if (!validAmbitionLevels.includes(ambition_level)) {
      return NextResponse.json(
        { error: 'Niveau d\'ambition invalide' },
        { status: 400 }
      );
    }

    // Validation - setup_status
    const validSetupStatuses = ['draft', 'configured'];
    if (!validSetupStatuses.includes(setup_status)) {
      return NextResponse.json(
        { error: 'Statut de configuration invalide' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    // Créer le site
    const { data: site, error } = await supabase
      .from('sites')
      .insert({
        name: name.trim(),
        theme_id,
        status,
        language,
        country,
        site_type,
        automation_level,
        ambition_level,
        description: description ? description.trim() : null,
        setup_status,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du site' },
      { status: 500 }
    );
  }
}
