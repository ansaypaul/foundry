/**
 * Configuration check script
 * Run with: node scripts/check-config.mjs
 */

// Check if environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Vérification de la configuration Foundry...\n');

let hasErrors = false;

// Check environment variables
console.log('📋 Variables d\'environnement:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName} - NON DÉFINIE`);
    hasErrors = true;
  } else {
    const preview = varName.includes('KEY') 
      ? value.substring(0, 20) + '...' 
      : value;
    console.log(`  ✅ ${varName} - ${preview}`);
  }
});

console.log('\n');

if (hasErrors) {
  console.log('❌ Configuration incomplète');
  console.log('\n💡 Pour corriger:');
  console.log('  1. Créez un fichier .env.local à la racine du projet');
  console.log('  2. Copiez le contenu de .env.example');
  console.log('  3. Remplissez les valeurs avec vos clés Supabase');
  console.log('  4. Consultez SUPABASE_SETUP.md pour plus de détails\n');
  process.exit(1);
} else {
  console.log('✅ Configuration correcte !');
  console.log('\n🚀 Vous pouvez lancer l\'application avec: npm run dev\n');
  process.exit(0);
}
