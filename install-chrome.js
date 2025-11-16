const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Verificando instalação do Chrome...');
  
  try {
    const browserFetcher = puppeteer.createBrowserFetcher();
    const revisionInfo = await browserFetcher.download(puppeteer.PUPPETEER_REVISIONS.chrome);
    console.log('✅ Chrome instalado em:', revisionInfo.executablePath);
  } catch (error) {
    console.error('❌ Erro ao instalar Chrome:', error);
    process.exit(1);
  }
})();
