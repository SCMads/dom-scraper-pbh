const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

(async () => {
  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║     📜 GABINETE DO PREFEITO (GP) - DOM 13/11/2025 - COMPLETO         ║
╚════════════════════════════════════════════════════════════════════════╝
`);
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const inicio = Date.now();
  
  try {
    console.log('⏳ Carregando...');
    await page.goto('https://dom-web.pbh.gov.br/', { waitUntil: 'load', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('📂 Expandindo...');
    await page.evaluate(() => {
      document.querySelectorAll('.collapse[style*="display: none"]').forEach(el => {
        el.style.display = 'block';
      });
    });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('🔍 Extraindo atos...\n');
    
    // Extrair seção GP completa
    const atosGP = await page.evaluate(() => {
      const texto = document.body.innerText;
      const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
      
      let gpIdx = -1;
      linhas.forEach((linha, idx) => {
        if (linha === 'GP - Gabinete do Prefeito') {
          gpIdx = idx;
        }
      });
      
      if (gpIdx < 0) return [];
      
      // Próxima seção
      const regexOrgao = /^[A-Z]{2,10}\s*[-–]\s*/;
      let proximaIdx = gpIdx + 1;
      for (let i = gpIdx + 1; i < linhas.length; i++) {
        if (regexOrgao.test(linhas[i])) {
          proximaIdx = i;
          break;
        }
      }
      
      return linhas.slice(gpIdx + 1, proximaIdx).filter(l => l.length > 5);
    });
    
    console.log(`📊 TOTAL DE ATOS: ${atosGP.length}\n`);
    console.log('═'.repeat(76) + '\n');
    console.log('�� ATOS DO GABINETE DO PREFEITO (13/11/2025):\n');
    
    atosGP.forEach((ato, idx) => {
      console.log(`${idx+1}. ${ato}`);
    });
    
    console.log('\n' + '═'.repeat(76));
    console.log('\n📖 DETALHES DOS PRINCIPAIS ATOS:\n');
    
    // Buscar links dos atos
    const detalhes = await page.evaluate(() => {
      const atos = [];
      const linksSeen = new Set();
      
      // Procurar links contendo termos dos atos
      document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (!href.includes('/visualizacao/ato/')) return;
        
        const texto = link.innerText?.trim() || '';
        if (!texto || linksSeen.has(href)) return;
        
        // Filtrar atos do Gabinete
        const textoUpper = texto.toUpperCase();
        if (textoUpper.includes('DECRETO') || 
            textoUpper.includes('LEI') || 
            textoUpper.includes('PREFEITO')) {
          linksSeen.add(href);
          atos.push({ titulo: texto, href });
        }
      });
      
      return atos;
    });
    
    console.log(`Atos com links encontrados: ${detalhes.length}\n`);
    
    // Extrair detalhes dos atos
    const CONCURRENT = 2;
    const atosCompletos = [];
    
    for (let i = 0; i < Math.min(detalhes.length, 10); i += CONCURRENT) {
      const batch = detalhes.slice(i, i + CONCURRENT);
      
      const promises = batch.map(async (ato) => {
        const p = await browser.newPage();
        try {
          await p.goto(ato.href, { waitUntil: 'domcontentloaded', timeout: 10000 });
          const conteudo = await p.evaluate(() => document.body.innerText);
          
          atosCompletos.push({
            titulo: ato.titulo,
            conteudo: conteudo
          });
          
          console.log(`\n${atosCompletos.length}. 📄 ${ato.titulo}`);
          console.log('─'.repeat(76));
          console.log(conteudo.substring(0, 1200));
          console.log('...\n');
          
          await p.close();
        } catch (err) {
          await p.close();
        }
      });
      
      await Promise.all(promises);
    }
    
    // Salvar relatório
    const relatorio = {
      data: '13/11/2025',
      orgao: 'GP - Gabinete do Prefeito',
      totalAtos: atosGP.length,
      atos: atosGP,
      atosDetalhados: atosCompletos.map(a => ({
        titulo: a.titulo,
        conteudo: a.conteudo.substring(0, 2000)
      }))
    };
    
    const arquivo = `gabinete-prefeito-13-11-2025.json`;
    fs.writeFileSync(arquivo, JSON.stringify(relatorio, null, 2));
    
    const tempo = ((Date.now() - inicio) / 1000).toFixed(2);
    
    console.log('═'.repeat(76));
    console.log(`\n💾 Relatório salvo: ${arquivo}`);
    console.log(`✅ Tempo total: ${tempo}s\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
  }
})();
