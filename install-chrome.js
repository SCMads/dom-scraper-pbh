const { execSync } = require('child_process');

console.log('🔍 Instalando Chrome para Puppeteer...');

try {
  execSync('npx puppeteer browsers install chrome', { 
    stdio: 'inherit',
    env: { ...process.env, PUPPETEER_CACHE_DIR: '/opt/render/.cache/puppeteer' }
  });
  console.log('✅ Chrome instalado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar Chrome:', error.message);
  process.exit(1);
}
