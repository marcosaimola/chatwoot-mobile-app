#!/bin/bash

# =============================================================================
# Script para gerar AAB (Android App Bundle) para upload na Google Play Store
#
# REQUISITOS:
#   - Java 17 (Homebrew) ou JDK do Android Studio
#   - Node.js 20+ (via nvm)
#   - Android SDK configurado
#   - upload-keystore.jks na raiz do projeto
#
# PATCHES CRÍTICOS (16KB page size):
#   Os patches em /patches/ são aplicados automaticamente via postinstall
#   (patch-package). Se rodar npm install e os patches não forem aplicados,
#   rode: npx patch-package
#
# USO: ./build-aab-with-android-studio-java.sh
# =============================================================================

set -e

echo ""
echo "============================================="
echo "  BUILD ANDROID AAB - AppConecta"
echo "============================================="
echo ""

# --- STEP 1: Detectar Java ---
echo "🔍 [1/7] Procurando Java..."

JAVA17_HOMEBREW="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
ANDROID_STUDIO_JAVA="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Possíveis localizações do Java do Android Studio no macOS
POSSIBLE_JAVA_PATHS=(
  "$ANDROID_STUDIO_JAVA"
  "/Applications/Android Studio.app/Contents/jre/Contents/Home"
  "$HOME/Library/Android/sdk/jbr/Contents/Home"
  "$HOME/Library/Android/sdk/jre/Contents/Home"
  "/Applications/Android Studio Preview.app/Contents/jbr/Contents/Home"
)

# Prioridade: Java 17 Homebrew > Android Studio JBR > JAVA_HOME atual
if [ -d "$JAVA17_HOMEBREW" ] && [ -f "$JAVA17_HOMEBREW/bin/java" ]; then
  export JAVA_HOME="$JAVA17_HOMEBREW"
  echo "   ✅ Usando Java 17 do Homebrew: $JAVA_HOME"
else
  FOUND=false
  for path in "${POSSIBLE_JAVA_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/bin/java" ]; then
      export JAVA_HOME="$path"
      FOUND=true
      echo "   ✅ Usando Java do Android Studio: $JAVA_HOME"
      break
    fi
  done

  if [ "$FOUND" = false ]; then
    if [ -n "$JAVA_HOME" ] && [ -f "$JAVA_HOME/bin/java" ]; then
      echo "   ⚠️  Usando JAVA_HOME atual: $JAVA_HOME"
    else
      echo "   ❌ Java não encontrado. Instale Java 17: brew install openjdk@17"
      exit 1
    fi
  fi
fi

export PATH="$JAVA_HOME/bin:$PATH"
JAVA_VERSION=$("$JAVA_HOME/bin/java" -version 2>&1 | head -n 1)
echo "   📦 Versão: $JAVA_VERSION"

# --- STEP 2: Detectar Node.js ---
echo ""
echo "🔍 [2/7] Procurando Node.js..."

NODE_PATH=$(command -v node 2>/dev/null)
if [ -z "$NODE_PATH" ] && [ -f "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  [ -f "$(dirname "$0")/.nvmrc" ] && nvm use 2>/dev/null || nvm use default 2>/dev/null || true
  NODE_PATH=$(command -v node 2>/dev/null)
fi
if [ -n "$NODE_PATH" ] && [ -f "$NODE_PATH" ]; then
  NODE_DIR=$(dirname "$NODE_PATH")
  export PATH="$NODE_DIR:$PATH"
  echo "   ✅ Node.js: $NODE_PATH ($(node --version))"
else
  echo "   ❌ Node.js não encontrado. Instale Node 20: nvm install 20 && nvm use 20"
  exit 1
fi

# --- STEP 3: Verificar estrutura do projeto ---
echo ""
echo "🔍 [3/7] Verificando projeto..."

cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

if [ ! -d "android" ]; then
  echo "   ❌ Diretório 'android' não encontrado. Execute 'npm run generate' primeiro."
  exit 1
fi

if [ ! -f "upload-keystore.jks" ]; then
  echo "   ⚠️  upload-keystore.jks não encontrado na raiz do projeto!"
  echo "      O build pode falhar na assinatura."
fi

echo "   ✅ Projeto OK: $PROJECT_ROOT"

# --- STEP 4: Verificar patches 16KB ---
echo ""
echo "🔍 [4/7] Verificando patches 16KB page size..."

PATCHES_OK=true

# Verificar se os patches existem
for patch_file in \
  "patches/expo-modules-core+2.2.3.patch" \
  "patches/expo-av+15.0.2.patch" \
  "patches/react-native-reanimated+3.16.7.patch"; do
  if [ -f "$patch_file" ]; then
    echo "   ✅ Patch encontrado: $(basename $patch_file)"
  else
    echo "   ⚠️  Patch NÃO encontrado: $patch_file"
    PATCHES_OK=false
  fi
done

# Verificar se os patches foram aplicados nos CMakeLists.txt
for cmake_file in \
  "node_modules/expo-modules-core/android/CMakeLists.txt" \
  "node_modules/expo-av/android/CMakeLists.txt" \
  "node_modules/react-native-reanimated/android/CMakeLists.txt"; do
  if [ -f "$cmake_file" ]; then
    if grep -q "max-page-size=16384" "$cmake_file" 2>/dev/null; then
      echo "   ✅ 16KB aplicado: $(basename $(dirname $(dirname $cmake_file)))"
    else
      echo "   ❌ 16KB NÃO aplicado em: $cmake_file"
      echo "      Aplicando patches agora..."
      npx patch-package 2>/dev/null || true
      PATCHES_OK=false
    fi
  fi
done

if [ "$PATCHES_OK" = false ]; then
  echo ""
  echo "   🔄 Re-verificando patches após aplicação..."
  for cmake_file in \
    "node_modules/expo-modules-core/android/CMakeLists.txt" \
    "node_modules/expo-av/android/CMakeLists.txt" \
    "node_modules/react-native-reanimated/android/CMakeLists.txt"; do
    if [ -f "$cmake_file" ]; then
      if grep -q "max-page-size=16384" "$cmake_file" 2>/dev/null; then
        echo "   ✅ OK: $(basename $(dirname $(dirname $cmake_file)))"
      else
        echo "   ❌ FALHA: $cmake_file - O build pode ser rejeitado pelo Google Play!"
      fi
    fi
  done
fi

# --- STEP 5: Limpar caches CMake ---
echo ""
echo "🧹 [5/7] Limpando caches CMake (garante recompilação com 16KB)..."

rm -rf android/app/.cxx 2>/dev/null || true
rm -rf node_modules/expo-modules-core/android/.cxx 2>/dev/null || true
rm -rf node_modules/expo-av/android/.cxx 2>/dev/null || true
rm -rf node_modules/react-native-reanimated/android/.cxx 2>/dev/null || true
echo "   ✅ Caches CMake limpos"

# --- STEP 6: Build ---
BUILD_APK=false
[ "${1:-}" = "apk" ] && BUILD_APK=true

echo ""
if [ "$BUILD_APK" = true ]; then
  echo "🚀 [6/7] Gerando APK (release)..."
else
  echo "🚀 [6/7] Gerando Android App Bundle (AAB)..."
fi
echo ""

cd android
if [ "$BUILD_APK" = true ]; then
  ./gradlew assembleRelease
else
  ./gradlew bundleRelease
fi

# --- STEP 7: Verificar resultado ---
echo ""
echo "🔍 [7/7] Verificando resultado..."

if [ "$BUILD_APK" = true ]; then
  OUTPUT_PATH="app/build/outputs/apk/release/app-release.apk"
else
  OUTPUT_PATH="app/build/outputs/bundle/release/app-release.aab"
fi

if [ ! -f "$OUTPUT_PATH" ]; then
  echo ""
  echo "❌ ERRO: Arquivo não foi gerado. Verifique os logs acima."
  exit 1
fi

OUTPUT_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
echo "   ✅ Gerado: $(pwd)/$OUTPUT_PATH ($OUTPUT_SIZE)"

# Verificar alinhamento 16KB das bibliotecas nativas
echo ""
echo "   📐 Verificando alinhamento 16KB das bibliotecas nativas..."

READELF=""
for ndk_dir in "$HOME/Library/Android/sdk/ndk/"*/; do
  CANDIDATE="${ndk_dir}toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf"
  if [ -f "$CANDIDATE" ]; then
    READELF="$CANDIDATE"
    break
  fi
done

# Para APK as libs estão em lib/arm64-v8a/*.so; para AAB em base/lib/arm64-v8a/*.so
if [ "$BUILD_APK" = true ]; then
  LIB_GLOB="lib/arm64-v8a/*.so"
else
  LIB_GLOB="base/lib/arm64-v8a/*.so"
fi

if [ -n "$READELF" ] && [ -f "$READELF" ]; then
  TEMP_DIR=$(mktemp -d)
  unzip -q -o "$OUTPUT_PATH" "$LIB_GLOB" -d "$TEMP_DIR" 2>/dev/null || true

  LIB_DIR="$TEMP_DIR/${LIB_GLOB%/*}"
  if [ -d "$LIB_DIR" ]; then
    HAS_PROBLEM=false
    for f in "$LIB_DIR/"*.so; do
      [ -f "$f" ] || continue
      align=$("$READELF" -l "$f" 2>/dev/null | grep LOAD | head -1 | awk '{print $NF}')
      name=$(basename "$f")
      if [ "$align" = "0x4000" ]; then
        echo "      ✅ $name: $align (16KB OK)"
      else
        echo "      ❌ $name: $align (PROBLEMA! Google Play vai rejeitar)"
        HAS_PROBLEM=true
      fi
    done

    if [ "$HAS_PROBLEM" = true ]; then
      echo ""
      echo "   ⚠️  ATENÇÃO: Algumas bibliotecas NÃO têm alinhamento 16KB!"
      echo "   O Google Play vai rejeitar este pacote."
      echo "   Verifique os patches em patches/ e rode npx patch-package"
    else
      echo ""
      echo "   ✅ TODAS as bibliotecas têm alinhamento 16KB correto!"
    fi
  fi
  rm -rf "$TEMP_DIR"
else
  echo "   ⚠️  llvm-readelf não encontrado - não foi possível verificar alinhamento"
  echo "   Instale o NDK pelo Android Studio para verificar automaticamente"
fi

echo ""
echo "============================================="
echo "  BUILD CONCLUÍDO COM SUCESSO!"
echo "============================================="
echo ""
echo "📁 Arquivo: $(pwd)/$OUTPUT_PATH"
echo "📊 Tamanho: $OUTPUT_SIZE"
echo ""
if [ "$BUILD_APK" = true ]; then
  echo "🎯 APK pronto para instalação direta ou testes."
else
  echo "🎯 Próximos passos:"
  echo "   1. Upload na Play Console (Google Play)"
  echo "   2. Ou via CLI: npm run submit:android"
fi
echo ""
