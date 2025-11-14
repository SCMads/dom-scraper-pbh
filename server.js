const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Lista completa de órgãos
const ORGAOS = [
  'GP - Gabinete do Prefeito',
  'PGM - Procuradoria Geral do Município',
  'CGM - Controladoria Geral do Município',
  'FPMZB - Fundação de Parques Municipais e Zoobotânica',
  'SMALOG - Secretaria Municipal de Administração Logística',
  'SMASA - Superintendência de Limpeza Urbana',
  'SMASDH - Secretaria Municipal de Assistência Social',
  'SMCTL - Secretaria Municipal de Cultura e Turismo',
  'SMDE - Secretaria Municipal de Desenvolvimento Econômico',
  'SMED - Secretaria Municipal de Educação',
  'SMFA - Secretaria Municipal de Fazenda',
  'SMGO - Secretaria Municipal de Governo',
  'SMMA - Secretaria Municipal de Meio Ambiente',
  'SMPOG - Secretaria Municipal de Planejamento, Orçamento e Gestão',
  'SMPU - Secretaria Municipal de Política Urbana',
  'SMSA - Secretaria Municipal de Saúde',
  'SMSE - Secretaria Municipal de Segurança',
  'SMOBI - Secretaria Municipal de Obras e Infraestrutura',
  'BHTRANS - Empresa de Transportes e Trânsito de Belo Horizonte',
  'BELOTUR - Empresa Municipal de Turismo de Belo Horizonte',
  'URBEL - Companhia Urbanizadora e de Habitação de Belo Horizonte',
  'SUDECAP - Superintendência de Desenvolvimento da Capital'
];

app.get('/api/orgaos', (req, res) => {
  res.json({ orgaos: ORGAOS });
});

app.post('/api/scrape', async (req, res) => {
  const { orgao } = req.body;
  
  try {
    const resultado = await scrapeOrgao(orgao || 'GP - Gabinete do Prefeito');
    res.json({ sucesso: true, dados: resultado });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

async function scrapeOrgao(nomeOrgao) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-extensions'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  });
  
  const page = await browser.newPage();
  
  await page.goto('https://dom-web.pbh.gov.br/', { waitUntil: 'load', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    document.querySelectorAll('.collapse[style*="display: none"]').forEach(el => {
      el.style.display = 'block';
    });
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const atos = await page.evaluate((orgao) => {
    const texto = document.body.innerText;
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l);
    
    let orgaoIdx = -1;
    linhas.forEach((linha, idx) => {
      if (linha === orgao) orgaoIdx = idx;
    });
    
    if (orgaoIdx < 0) return [];
    
    const regexOrgao = /^[A-Z]{2,10}\s*[-–]\s*/;
    let proximaIdx = linhas.length;
    for (let i = orgaoIdx + 1; i < linhas.length; i++) {
      if (regexOrgao.test(linhas[i])) {
        proximaIdx = i;
        break;
      }
    }
    
    return linhas.slice(orgaoIdx + 1, proximaIdx).filter(l => l.length > 5);
  }, nomeOrgao);
  
  await browser.close();
  
  return {
    orgao: nomeOrgao,
    data: new Date().toLocaleDateString('pt-BR'),
    total: atos.length,
    atos: atos
  };
}

app.listen(PORT, () => {
  console.log(`\n🚀 DOM Scraper rodando em http://localhost:${PORT}\n`);
});
