/**
 * API Route: GET /api/admin/domains/[id]/domain-status
 * Récupère le statut actuel du Domain Push
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDomainPushStatus } from '@/lib/domainOrchestrator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    console.log(`[API] Récupération statut pour domain ID: ${id}`);

    // Récupérer le statut
    const status = await getDomainPushStatus(id);

    return NextResponse.json({
      success: true,
      ...status,
    });

  } catch (error) {
    console.error('[API] Erreur récupération statut:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
