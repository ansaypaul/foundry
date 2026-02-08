import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  // Vérifier si déjà connecté
  const cookieStore = await cookies();
  const session = cookieStore.get('foundry-session');
  
  if (session) {
    redirect('/admin');
  }

  return <LoginForm />;
}
