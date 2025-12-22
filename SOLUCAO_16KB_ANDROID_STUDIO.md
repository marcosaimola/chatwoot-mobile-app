# 🔧 Solução 16KB Page Size - Android Studio

## Problema
O Google Play está rejeitando o bundle com erro: "Seu app não é compatível com tamanhos de página de 16 KB de memória"

## ✅ Ações no Android Studio

### 1. **Verificar Versão do Android Gradle Plugin (AGP)**

O AGP 8.5.1+ tem melhor suporte para 16KB. Vamos verificar e atualizar:

1. Abra o projeto no Android Studio
2. Vá em **File → Project Structure** (ou `⌘;`)
3. Na aba **Project**, verifique a versão do **Android Gradle Plugin**
4. Se for menor que 8.5.1, atualize para 8.5.1 ou superior

**Ou edite manualmente** `android/build.gradle`:
```gradle
dependencies {
    classpath('com.android.tools.build:gradle:8.5.1')  // ou versão mais recente
    // ...
}
```

### 2. **Verificar Bibliotecas com APK Analyzer**

1. No Android Studio, vá em **Build → Analyze APK...**
2. Selecione o arquivo: `android/app/build/outputs/bundle/release/app-release.aab`
3. Expanda a pasta `base/lib/arm64-v8a/` (ou outras arquiteturas)
4. Verifique se há bibliotecas `.so` que podem estar causando problemas
5. Anote quais bibliotecas são grandes ou de terceiros

### 3. **Verificar Configurações de Build**

1. Abra **File → Project Structure** (`⌘;`)
2. Vá em **Modules → app**
3. Na aba **Flavors**, verifique se há configurações específicas
4. Na aba **Build Variants**, certifique-se de que está usando `release`

### 4. **Limpar e Rebuild Completo**

1. **Build → Clean Project**
2. **File → Invalidate Caches / Restart...**
   - Selecione "Invalidate and Restart"
3. Após reiniciar, **Build → Rebuild Project**

### 5. **Verificar NDK no SDK Manager**

1. **Tools → SDK Manager**
2. Aba **SDK Tools**
3. Verifique se **NDK (Side by side)** versão **29.0.14206865** está instalada e marcada
4. Se não estiver, instale e marque

### 6. **Verificar Variáveis de Ambiente**

No Android Studio:
1. **Android Studio → Settings** (ou `⌘,`)
2. **Build, Execution, Deployment → Build Tools → Gradle**
3. Verifique se **Gradle JDK** está configurado corretamente
4. Verifique se **Android SDK** está apontando para o local correto

### 7. **Build via Android Studio (em vez de linha de comando)**

Às vezes o Android Studio aplica configurações adicionais:

1. **Build → Generate Signed Bundle / APK...**
2. Selecione **Android App Bundle**
3. Selecione o keystore de release
4. Clique em **Next** e depois **Finish**
5. O bundle será gerado com todas as configurações do Android Studio aplicadas

### 8. **Verificar Logs de Build**

1. **View → Tool Windows → Build**
2. Gere o bundle novamente
3. Verifique os logs para ver se há avisos sobre alinhamento de bibliotecas
4. Procure por mensagens relacionadas a "16KB", "page size", "alignment"

## 🔍 Verificações Adicionais

### Verificar se há bibliotecas problemáticas

Algumas bibliotecas conhecidas que podem causar problemas:
- Bibliotecas antigas do React Native
- Bibliotecas nativas de terceiros não atualizadas
- Bibliotecas que não foram recompiladas com NDK r29

### Solução Alternativa: Atualizar Bibliotecas

Se identificar bibliotecas específicas:
1. Verifique se há atualizações disponíveis
2. Atualize para versões mais recentes que suportam 16KB
3. Recompile o projeto

## 📝 Checklist

- [ ] Android Gradle Plugin 8.5.1+ instalado
- [ ] NDK r29 instalado e selecionado
- [ ] Clean Project executado
- [ ] Caches invalidados
- [ ] Bundle gerado via Android Studio (não apenas linha de comando)
- [ ] Logs de build verificados
- [ ] Bibliotecas problemáticas identificadas (se houver)

## ⚠️ Se Nada Funcionar

Se após todas essas ações o problema persistir, pode ser necessário:

1. **Usar EAS Build** (recomendado pelo Expo para builds de produção)
2. **Atualizar bibliotecas específicas** que estão causando o problema
3. **Contatar suporte do Google Play** para mais detalhes sobre qual biblioteca específica está causando o problema

## 🚀 Comando Rápido para Testar

Após fazer as configurações no Android Studio, teste gerando o bundle:

```bash
cd android
./gradlew clean bundleRelease
```

O bundle estará em: `android/app/build/outputs/bundle/release/app-release.aab`

