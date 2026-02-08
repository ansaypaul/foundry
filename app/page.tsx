import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('foundry-session');

  // Si connecté, rediriger vers l'admin
  if (session) {
    redirect('/admin');
  }

  // Sinon, rediriger vers la page de login
  redirect('/login');
}
