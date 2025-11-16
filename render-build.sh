#!/usr/bin/env bash
set -o errexit

echo "📦 Instalando dependências..."
npm install

echo "🌐 Instalando Chrome..."
npx puppeteer browsers install chrome

echo "✅ Build concluído!"
