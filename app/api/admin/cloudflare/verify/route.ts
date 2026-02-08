/**
 * API Route: GET /api/admin/cloudflare/verify
 * Vérifie que le token Cloudflare est valide
 * 
 * Point de debug pour tester l'authentification Cloudflare isolément
 */

import { NextResponse } from 'next/server';

// Force Node.js runtime pour accès complet aux variables d'environnement
export const runtime = 'nodejs';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export async function GET() {
  try {
    const token = process.env.CLOUDFLARE_API_TOKEN;

    // Vérifications préliminaires
    console.log('[CF Verify] Starting verification...');
    console.log('[CF Verify] Token present:', Boolean(token));
    console.log('[CF Verify] Token length:', token?.length || 0);
    console.log('[CF Verify] Token preview:', token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 'N/A');

    if (!token || token.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'CLOUDFLARE_API_TOKEN is missing or empty',
        debug: {
          tokenPresent: Boolean(token),
          tokenLength: token?.length || 0,
        }
      }, { status: 400 });
    }

    // Appel à l'API de vérification Cloudflare
    const url = `${CLOUDFLARE_API_BASE}/user/tokens/verify`;
    
    console.log('[CF Verify] Calling:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[CF Verify] Response status:', response.status);

    const data = await response.json();

    console.log('[CF Verify] Response data:', JSON.stringify(data, null, 2));

    // Retourner la réponse brute de Cloudflare
    return NextResponse.json({
      success: data.success || false,
      cloudflareResponse: data,
      debug: {
        tokenPresent: true,
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 5)}`,
        httpStatus: response.status,
      }
    });

  } catch (error) {
    console.error('[CF Verify] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
