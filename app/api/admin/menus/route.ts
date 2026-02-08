import { NextRequest, NextResponse } from 'next/server';
import { createMenu, getMenusBySiteId } from '@/lib/db/menus-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_id, name, location, items } = body;

    if (!site_id || !name || !location) {
      return NextResponse.json(
        { error: 'Site, nom et emplacement requis' },
        { status: 400 }
      );
    }

    const menu = await createMenu({
      site_id,
      name: name.trim(),
      location,
      items: items || '[]',
      position: 0,
    });

    return NextResponse.json({ menu });
  } catch (error: any) {
    console.error('Error creating menu:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Un menu existe déjà pour cet emplacement sur ce site' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du menu' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID requis' },
        { status: 400 }
      );
    }

    const menus = await getMenusBySiteId(siteId);
    return NextResponse.json({ menus });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des menus' },
      { status: 500 }
    );
  }
}
