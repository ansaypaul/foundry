import { NextRequest, NextResponse } from 'next/server';
import {
  buildSeoBootstrapPlan,
  applySeoBootstrapPlan,
  getSeoBootstrapStats,
} from '@/lib/services/setup/seoBootstrap';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get SEO bootstrap stats and plan preview
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;

    const [stats, plan] = await Promise.all([
      getSeoBootstrapStats(siteId),
      buildSeoBootstrapPlan(siteId),
    ]);

    return NextResponse.json({
      stats,
      plan: {
        siteSeoWillBeCreated: !!plan.siteSeo,
        contentSeoToCreate: plan.contentSeo.length,
        termSeoToCreate: plan.termSeo.length,
      },
    });
  } catch (error) {
    console.error('Error getting SEO bootstrap stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des stats SEO' },
      { status: 500 }
    );
  }
}

// POST: Apply SEO bootstrap (create seo_meta rows)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: siteId } = await params;

    // Build plan
    const plan = await buildSeoBootstrapPlan(siteId);

    // Apply plan
    await applySeoBootstrapPlan(siteId, plan);

    // Get updated stats
    const stats = await getSeoBootstrapStats(siteId);

    return NextResponse.json({
      success: true,
      stats,
      created: {
        siteSeo: !!plan.siteSeo,
        contentSeo: plan.contentSeo.length,
        termSeo: plan.termSeo.length,
      },
    });
  } catch (error) {
    console.error('Error applying SEO bootstrap:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du SEO minimal' },
      { status: 500 }
    );
  }
}
