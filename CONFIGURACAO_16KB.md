# Configuração para Suporte a 16KB Page Size (Android 15+)

## O que é 16KB Page Size?

O Android tradicionalmente usa páginas de memória de 4KB. Dispositivos mais recentes (especialmente com processadores ARM novos) usam páginas de 16KB para melhor desempenho. Apps que não suportam 16KB page size podem travar ou não funcionar nesses dispositivos.

## Requisitos da Google Play Store

A partir de agosto de 2024, a Google Play Store **rejeita** apps que:
- Suportam Android 15 (API 35) ou superior
- Não possuem bibliotecas nativas alinhadas para 16KB

---

## Configurações Aplicadas

### 1. NDK Versão r27

**Arquivo**: `android/build.gradle`

```gradle
buildscript {
    ext {
        ndkVersion = "27.1.12297006"  // NDK r27
    }
}
```

**Por que NDK r27?**
- Suporte completo a 16KB page size
- Compila bibliotecas nativas (.so) com alinhamento correto
- Não requer aceitar novas licenças (diferente do r28)
- Combinado com `APP_SUPPORT_FLEXIBLE_PAGE_SIZES` oferece suporte completo

### 2. Application.mk

**Arquivo**: `android/app/Application.mk` (criado)

```makefile
APP_SUPPORT_FLEXIBLE_PAGE_SIZES := true
```

**O que faz?**
- Habilita suporte flexível a diferentes tamanhos de página
- Permite que o app funcione em dispositivos 4KB e 16KB
- É reconhecida pelo NDK r27+

### 3. Gradle Properties

**Arquivo**: `android/gradle.properties`

```properties
# Android 15+ - 16KB page size support
# Enable R8 full mode for better optimization
android.enableR8.fullMode=true

# 16KB page size support (required for Android 15+)
# NDK r27+ with APP_SUPPORT_FLEXIBLE_PAGE_SIZES flag handles alignment automatically
```

**⚠️ Propriedade Removida**: `android.bundle.enableUncompressedNativeLibs`

Esta propriedade foi **removida** porque:
- **Depreciada** no Android Gradle Plugin 8.1+
- Causa **erro de build**: `The option 'android.bundle.enableUncompressedNativeLibs' is deprecated`
- O NDK r27+ já gerencia o alinhamento automaticamente

---

## Evolução das Configurações

### ❌ Tentativa 1: NDK r28
- Requer aceitar novas licenças do Android SDK
- Processo de aceite falhou no ambiente de build
- Licença: `ndk;28.0.12674087 NDK (Side by side) 28.0.12674087`

### ❌ Tentativa 2: Propriedade deprecated
- Uso de `android.bundle.enableUncompressedNativeLibs=false`
- Causou erro: "The option is deprecated. It was removed in version 8.1 of the Android Gradle plugin."

### ✅ Solução Final: NDK r27 + Application.mk
- NDK r27 já instalado e funcional
- Flag `APP_SUPPORT_FLEXIBLE_PAGE_SIZES := true` no Application.mk
- Sem propriedades deprecadas
- Build funciona perfeitamente

---

## Como Funciona

1. **NDK r27**: Compila bibliotecas nativas com suporte a páginas flexíveis
2. **APP_SUPPORT_FLEXIBLE_PAGE_SIZES**: Instrui o NDK a criar bibliotecas compatíveis com múltiplos tamanhos
3. **R8 Full Mode**: Otimiza código Java/Kotlin mantendo compatibilidade

O resultado: bibliotecas `.so` são compiladas com alinhamento que funciona tanto em dispositivos 4KB quanto 16KB.

---

## Gerar AAB/APK

### APK para Testes
```bash
cd android
./gradlew clean assembleRelease
```

APK gerado em: `android/app/build/outputs/apk/release/app-release.apk`

### AAB para Play Store
```bash
cd android
./gradlew clean bundleRelease
```

AAB gerado em: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Verificar Suporte a 16KB

### 1. Verificar Configurações

```bash
# NDK Versão
cat android/build.gradle | grep ndkVersion
# Deve mostrar: ndkVersion = "27.1.12297006"

# Application.mk
cat android/app/Application.mk
# Deve mostrar: APP_SUPPORT_FLEXIBLE_PAGE_SIZES := true

# Gradle Properties (NÃO deve ter a propriedade deprecated)
cat android/gradle.properties | grep "enableUncompressedNativeLibs"
# Não deve retornar nada
```

### 2. Testar no Dispositivo

```bash
# Instalar APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Verificar page size do dispositivo
adb shell getconf PAGE_SIZE
# 4096 = 4KB, 16384 = 16KB

# Verificar logs
adb logcat | grep "page size"
```

### 3. Verificar Alinhamento das Bibliotecas

```bash
# Extrair APK
unzip -q app-release.apk -d extracted_apk

# Verificar alinhamento
find extracted_apk/lib -name "*.so" -exec sh -c '
    for file; do
        offset=$(zipinfo -v app-release.apk "$file" | grep "offset" | awk "{print \$NF}")
        alignment=$((offset % 16384))
        if [ $alignment -eq 0 ]; then
            echo "✅ $file: alinhado"
        else
            echo "❌ $file: NÃO alinhado"
        fi
    done
' sh {} +
```

---

## Troubleshooting

### Erro: "option is deprecated"
**Causa**: `android.bundle.enableUncompressedNativeLibs` presente no gradle.properties  
**Solução**: Remova esta linha do arquivo

### NDK não encontrado
**Causa**: NDK r27 não instalado  
**Solução**:
1. Android Studio → Tools → SDK Manager
2. SDK Tools → NDK (Side by side)
3. Marque versão 27.1.12297006
4. Apply

### Play Console rejeita AAB
**Causa**: AAB não foi gerado após as mudanças  
**Solução**:
1. `./gradlew clean`
2. `./gradlew bundleRelease`
3. Fazer novo upload

---

## Checklist Final

- [x] NDK r27 configurado em `android/build.gradle`
- [x] `Application.mk` criado com `APP_SUPPORT_FLEXIBLE_PAGE_SIZES := true`
- [x] Propriedade deprecated removida do `gradle.properties`
- [x] Keystore configurado corretamente
- [x] APK de teste gerado e funcionando
- [ ] AAB gerado e enviado para Play Store
- [ ] Play Store aceitou o AAB (sem erro de 16KB)

---

## Referências

- [Android Developers - 16KB Page Size](https://developer.android.com/guide/practices/page-sizes)
- [NDK r27 Release Notes](https://developer.android.com/ndk/downloads/revision_history)
- [APP_SUPPORT_FLEXIBLE_PAGE_SIZES](https://developer.android.com/ndk/guides/application_mk#app_support_flexible_page_sizes)
- [Google Play Console - Requirements](https://support.google.com/googleplay/android-developer/answer/11150767)

---

**Última atualização**: Outubro 2025 - Configuração final com NDK r27
