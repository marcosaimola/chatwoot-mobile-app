#!/bin/bash
# Instala CocoaPods (se necessário) e roda pod install no iOS.
set -e
cd "$(dirname "$0")"

# Incluir Homebrew no PATH se existir (Apple Silicon ou Intel)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v pod >/dev/null 2>&1; then
  echo "📦 CocoaPods não encontrado. Instalando..."
  if command -v brew >/dev/null 2>&1; then
    echo "Usando Homebrew..."
    brew install cocoapods
  else
    echo "Homebrew não encontrado."
    echo ""
    echo "Instale o Homebrew primeiro (uma linha):"
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "Depois adicione ao PATH (Mac M1/M2/M3):"
    echo '  echo '\''eval "$(/opt/homebrew/bin/brew shellenv)"'\'' >> ~/.zprofile'
    echo '  eval "$(/opt/homebrew/bin/brew shellenv)"'
    echo ""
    echo "Feche e abra o Terminal, então rode este script de novo."
    echo "Ou veja INSTALAR_COCOAPODS.md para o passo a passo."
    exit 1
  fi
fi

echo ""
# O Podfile usa 'node' para resolver caminhos do Expo — garantir que Node está no PATH
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm use 2>/dev/null || nvm use default 2>/dev/null || true
fi
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node não encontrado. O Podfile precisa do Node (ex: nvm use 20)."
  echo "   Rode: nvm use 20   e depois execute este script de novo."
  exit 1
fi
echo "📦 Node: $(node -v)"
echo ""
echo "🍎 Instalando pods no projeto iOS..."
cd ios
export LANG=en_US.UTF-8
pod install
cd ..

echo ""
echo "✅ Pronto! Abra o workspace no Xcode:"
echo "   open ios/AppConecta.xcworkspace"
echo ""
