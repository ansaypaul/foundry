import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import bcrypt from 'bcryptjs';

// Route de debug - À SUPPRIMER EN PRODUCTION
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  // Vérifier si l'utilisateur existe
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@foundry.local')
    .single();

  if (error || !user) {
    // Créer l'utilisateur s'il n'existe pas
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@foundry.local',
        password_hash: hash,
        name: 'Admin',
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({
        error: 'Erreur lors de la création',
        details: createError,
      });
    }

    return NextResponse.json({
      message: 'Utilisateur créé',
      user: newUser,
      hash,
    });
  }

  // Test du mot de passe
  const testPassword = 'admin123';
  const isValid = await bcrypt.compare(testPassword, user.password_hash);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    password_hash: user.password_hash,
    test_password: testPassword,
    is_valid: isValid,
  });
}
