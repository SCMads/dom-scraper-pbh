# DOM-PBH Scraper Oficial

Scraper funcional para extrair atos do Diário Oficial do Município de Belo Horizonte.

## Uso

```bash
node scraper-oficial-funcional.js
```

## Saída

- Lista todos os atos do Gabinete do Prefeito
- Salva JSON com dados extraídos
- Arquivo gerado: `gabinete-prefeito-[data].json`

## Características

- Usa `waitUntil: 'load'` (mais rápido que networkidle2)
- Expande automaticamente as seções colapsadas
- Aguarda 3000ms após expansão para garantir carregamento
- Extrai seção GP completa do DOM

## Dependências

```bash
npm install
```

Requer:
- puppeteer-extra
- puppeteer-extra-plugin-stealth
