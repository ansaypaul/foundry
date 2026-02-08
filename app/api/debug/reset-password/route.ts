import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

// Route pour réinitialiser le mot de passe admin - À SUPPRIMER EN PRODUCTION
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  // Générer un nouveau hash pour "admin123"
  const password = 'admin123';
  const newHash = await bcrypt.hash(password, 10);

  // Mettre à jour l'utilisateur
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      password_hash: newHash,
    })
    .eq('email', 'admin@foundry.local')
    .select()
    .single();

  if (error) {
    return NextResponse.json({
      error: 'Erreur lors de la mise à jour',
      details: error,
    }, { status: 500 });
  }

  // Vérifier que ça marche
  const isValid = await bcrypt.compare(password, newHash);

  return NextResponse.json({
    message: 'Mot de passe réinitialisé avec succès',
    new_hash: newHash,
    test_valid: isValid,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    },
  });
}
