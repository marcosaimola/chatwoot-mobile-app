#!/bin/bash
# Configura o ambiente: dependências, pastas nativas (ios/android) e pods.
# Execute na raiz do projeto no seu terminal (onde Node/npm estão disponíveis).
set -e
cd "$(dirname "$0")"

echo "📦 1/4 Instalando dependências..."
npm install

echo ""
echo "🔨 2/4 Gerando pastas nativas (ios + android)..."
npm run generate

echo ""
echo "🍎 3/4 Instalando CocoaPods (iOS)..."
export LANG=en_US.UTF-8
cd ios && pod install && cd ..

echo ""
echo "✅ 4/4 Ambiente configurado."
echo ""
echo "Próximos passos:"
echo "  iOS:        npm run run:ios   (ou abra ios/*.xcworkspace no Xcode)"
echo "  Android:    npm run run:android"
echo "  Gerar AAB:  ./build-aab-with-android-studio-java.sh"
echo ""
