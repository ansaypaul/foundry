/**
 * Script de test pour vérifier la configuration Push Domain
 * Usage: node --loader ts-node/esm scripts/test-push-config.ts
 * Ou via: npm run test-push-config
 */

import { validateDomainPushEnv, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID } from '../lib/env';

async function testCloudflareConnection() {
  console.log('\n🔵 Test Cloudflare API...');
  
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Token Cloudflare valide');
      console.log('   Account ID:', CLOUDFLARE_ACCOUNT_ID);
    } else {
      console.error('❌ Token Cloudflare invalide:', data.errors);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur connexion Cloudflare:', error);
    return false;
  }

  return true;
}

async function testVercelConnection() {
  console.log('\n🟢 Test Vercel API...');
  
  try {
    const url = VERCEL_TEAM_ID 
      ? `https://api.vercel.com/v9/projects?teamId=${VERCEL_TEAM_ID}`
      : 'https://api.vercel.com/v9/projects';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Token Vercel invalide (HTTP', response.status, ')');
      return false;
    }

    const data = await response.json();
    console.log('✅ Token Vercel valide');
    console.log('   Projets trouvés:', data.projects?.length || 0);
    console.log('   Project ID configuré:', VERCEL_PROJECT_ID || 'Non configuré');
    
    if (VERCEL_TEAM_ID) {
      console.log('   Team ID:', VERCEL_TEAM_ID);
    }

    // Afficher les premiers projets
    if (data.projects && data.projects.length > 0) {
      console.log('\n   Projets disponibles:');
      data.projects.slice(0, 5).forEach((p: any) => {
        const marker = p.id === VERCEL_PROJECT_ID ? ' ← CONFIGURÉ' : '';
        console.log(`   - ${p.name} (${p.id})${marker}`);
      });
      if (data.projects.length > 5) {
        console.log(`   ... et ${data.projects.length - 5} autres`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur connexion Vercel:', error);
    return false;
  }

  return true;
}

async function main() {
  console.log('🚀 Test de configuration Push Domain\n');
  console.log('='.repeat(50));

  // 1. Vérifier les variables d'environnement
  console.log('\n📋 Vérification des variables d\'environnement...');
  try {
    validateDomainPushEnv();
    console.log('✅ Toutes les variables requises sont présentes');
  } catch (error) {
    console.error('❌ Configuration incomplète:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // 2. Test Cloudflare
  const cloudflareOk = await testCloudflareConnection();

  // 3. Test Vercel
  const vercelOk = await testVercelConnection();

  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Résumé:');
  console.log('   Cloudflare:', cloudflareOk ? '✅ OK' : '❌ Échec');
  console.log('   Vercel:', vercelOk ? '✅ OK' : '❌ Échec');

  if (cloudflareOk && vercelOk) {
    console.log('\n✨ Configuration complète et fonctionnelle !');
    console.log('   Vous pouvez maintenant utiliser le Push Domain.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez vos tokens.');
    process.exit(1);
  }
}

main().catch(console.error);
