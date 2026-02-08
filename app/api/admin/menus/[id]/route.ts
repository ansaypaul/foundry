import { NextRequest, NextResponse } from 'next/server';
import { updateMenu, deleteMenu } from '@/lib/db/menus-queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, location, items } = body;

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (location) updates.location = location;
    if (items !== undefined) updates.items = items;

    const menu = await updateMenu(id, updates);
    return NextResponse.json({ menu });
  } catch (error: any) {
    console.error('Error updating menu:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Un menu existe déjà pour cet emplacement sur ce site' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du menu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteMenu(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du menu' },
      { status: 500 }
    );
  }
}
