#!/bin/bash

# Script para instalar módulos nativos customizados após regeneração do projeto
# Uso: ./scripts/install-native-modules.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📦 Instalando módulos nativos customizados..."

# Verificar se a pasta ios existe
if [ ! -d "$PROJECT_ROOT/ios/ZapiCrm" ]; then
    echo "❌ Pasta ios/ZapiCrm não encontrada. Execute 'npm run generate' primeiro."
    exit 1
fi

# Copiar módulos iOS
echo "📱 Copiando módulos iOS..."

if [ -f "$PROJECT_ROOT/native-modules/ios-native/NowPlayingManager.h" ]; then
    cp "$PROJECT_ROOT/native-modules/ios-native/NowPlayingManager.h" "$PROJECT_ROOT/ios/ZapiCrm/"
    echo "   ✓ NowPlayingManager.h"
fi

if [ -f "$PROJECT_ROOT/native-modules/ios-native/NowPlayingManager.m" ]; then
    cp "$PROJECT_ROOT/native-modules/ios-native/NowPlayingManager.m" "$PROJECT_ROOT/ios/ZapiCrm/"
    echo "   ✓ NowPlayingManager.m"
fi

# Verificar se os arquivos já estão no project.pbxproj
PBXPROJ="$PROJECT_ROOT/ios/ZapiCrm.xcodeproj/project.pbxproj"

if grep -q "NowPlayingManager.m" "$PBXPROJ"; then
    echo "   ✓ NowPlayingManager já está no projeto Xcode"
else
    echo ""
    echo "⚠️  ATENÇÃO: Os arquivos foram copiados, mas você precisa adicioná-los ao Xcode manualmente:"
    echo ""
    echo "   1. Abra ios/ZapiCrm.xcworkspace no Xcode"
    echo "   2. Arraste NowPlayingManager.h e NowPlayingManager.m para o grupo ZapiCrm"
    echo "   3. Marque 'Copy items if needed' e 'Create groups'"
    echo "   4. Faça Clean Build (Cmd+Shift+K) e Build (Cmd+B)"
    echo ""
fi

echo ""
echo "✅ Módulos nativos instalados!"
echo ""
echo "Próximos passos:"
echo "   cd ios && pod install"
echo "   open ZapiCrm.xcworkspace"
