# Instalar CocoaPods no Mac (sem Homebrew)

O `gem install cocoapods` deu timeout no RubyGems. Use uma destas opções:

---

## Opção A: Instalar Homebrew e depois CocoaPods (recomendado)

### 1. Instalar o Homebrew

No Terminal, rode (vai pedir senha e ENTER):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Colocar o `brew` no PATH

No final da instalação o Homebrew mostra dois comandos. No Mac com chip **Apple (M1/M2/M3)** rode:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

(Se for Mac **Intel**, use `/usr/local/bin/brew` em vez de `/opt/homebrew/bin/brew`.)

### 3. Fechar e abrir o Terminal de novo (ou abrir uma nova aba)

### 4. Instalar CocoaPods e rodar pod install

```bash
brew install cocoapods
cd /Users/nextphones/Documents/Projetos/appconnect/ios
export LANG=en_US.UTF-8
pod install
```

### 5. Abrir o projeto no Xcode

```bash
open /Users/nextphones/Documents/Projetos/appconnect/ios/AppConecta.xcworkspace
```

---

## Opção B: CocoaPods só com gem (outra rede/VPN)

Se o timeout for de rede, tente em outro Wi‑Fi ou com VPN e rode:

```bash
sudo gem install cocoapods --http-open-timeout 300 --http-read-timeout 300
```

Depois:

```bash
cd /Users/nextphones/Documents/Projetos/appconnect/ios
export LANG=en_US.UTF-8
pod install
open AppConecta.xcworkspace
```
