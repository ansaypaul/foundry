import { NextResponse } from 'next/server';
import { getAllThemes } from '@/lib/db/themes-queries';

export async function GET() {
  try {
    const themes = await getAllThemes();
    return NextResponse.json({ themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des thèmes' },
      { status: 500 }
    );
  }
}
