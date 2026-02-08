/**
 * API Route: POST /api/admin/domains/[id]/push-domain
 * Lance le processus d'automatisation Domain Push (Cloudflare + Vercel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pushDomain } from '@/lib/domainOrchestrator';

// Force Node.js runtime pour accès complet aux variables d'environnement
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    console.log(`[API] Push domain démarré pour domain ID: ${id}`);

    // Lancer l'orchestrateur
    const result = await pushDomain(id);

    // Retourner le résultat
    return NextResponse.json({
      success: result.success,
      status: result.status,
      message: result.message,
      needsAction: result.needsAction,
    });

  } catch (error) {
    console.error('[API] Erreur push domain:', error);
    
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
