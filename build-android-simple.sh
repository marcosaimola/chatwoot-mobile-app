#!/bin/bash

# Script simplificado para build Android
# Configura automaticamente o ANDROID_HOME e faz o build

set -e

echo "🚀 Build Android - AppConecta"
echo "================================"
echo ""

# Configurar ANDROID_HOME automaticamente
export ANDROID_HOME=/Users/nextphones/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/emulator

# Verificar se SDK existe
if [ ! -d "$ANDROID_HOME" ]; then
  echo "❌ Erro: Android SDK não encontrado em $ANDROID_HOME"
  echo "   Por favor, instale o Android Studio e o SDK"
  exit 1
fi

echo "✅ Android SDK encontrado: $ANDROID_HOME"
echo ""

# Encontrar Java do Android Studio
if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  echo "✅ Java do Android Studio encontrado: $JAVA_HOME"
else
  echo "⚠️  Java do Android Studio não encontrado, usando Java do sistema"
fi

echo ""
echo "📦 Escolha o tipo de build:"
echo "1) APK (para testes - instalar direto no dispositivo)"
echo "2) AAB (para Google Play Store)"
echo ""
read -p "Digite 1 ou 2: " BUILD_TYPE

cd android

if [ "$BUILD_TYPE" = "1" ]; then
  echo ""
  echo "🔨 Gerando APK..."
  echo ""
  ./gradlew assembleRelease
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ APK gerado com sucesso!"
    echo ""
    echo "📍 Localização: android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📲 Para instalar no dispositivo:"
    echo "   adb install app/build/outputs/apk/release/app-release.apk"
    echo ""
  else
    echo ""
    echo "❌ Erro ao gerar APK"
    exit 1
  fi
  
elif [ "$BUILD_TYPE" = "2" ]; then
  echo ""
  echo "🔨 Gerando AAB..."
  echo ""
  ./gradlew bundleRelease
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ AAB gerado com sucesso!"
    echo ""
    echo "📍 Localização: android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo "📤 Para enviar à Play Store:"
    echo "   1. Acesse: https://play.google.com/console"
    echo "   2. Selecione seu app"
    echo "   3. Release → Production/Testing"
    echo "   4. Faça upload do AAB"
    echo ""
  else
    echo ""
    echo "❌ Erro ao gerar AAB"
    exit 1
  fi
  
else
  echo ""
  echo "❌ Opção inválida"
  exit 1
fi
