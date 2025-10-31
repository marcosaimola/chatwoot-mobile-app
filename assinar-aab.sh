#!/bin/bash

# Script para assinar AAB com o novo keystore após aprovação do Google
# Uso: ./assinar-aab.sh [caminho-para-aab]

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Assinando AAB com upload-keystore.jks ===${NC}\n"

# Verificar se o arquivo AAB foi fornecido
if [ -z "$1" ]; then
    AAB_FILE="android/app/build/outputs/bundle/release/app-release.aab"
    echo -e "${YELLOW}Nenhum arquivo AAB fornecido, usando: ${AAB_FILE}${NC}"
else
    AAB_FILE="$1"
fi

# Verificar se o arquivo existe
if [ ! -f "$AAB_FILE" ]; then
    echo -e "${RED}Erro: Arquivo AAB não encontrado: ${AAB_FILE}${NC}"
    exit 1
fi

# Verificar se o keystore existe
KEYSTORE_FILE="upload-keystore.jks"
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${RED}Erro: Keystore não encontrado: ${KEYSTORE_FILE}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Arquivo AAB encontrado: ${AAB_FILE}${NC}"
echo -e "${GREEN}✓ Keystore encontrado: ${KEYSTORE_FILE}${NC}\n"

# Criar backup do AAB original
BACKUP_FILE="${AAB_FILE}.backup"
cp "$AAB_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup criado: ${BACKUP_FILE}${NC}\n"

# Solicitar senha do keystore
read -sp "Digite a senha do keystore: " KEYSTORE_PASSWORD
echo ""

# Assinar o AAB
echo -e "${YELLOW}Assinando AAB...${NC}"
jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA-256 \
    -keystore "$KEYSTORE_FILE" \
    -storepass "$KEYSTORE_PASSWORD" \
    "$AAB_FILE" \
    upload

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ AAB assinado com sucesso!${NC}\n"
    
    # Verificar assinatura
    echo -e "${YELLOW}Verificando assinatura...${NC}"
    jarsigner -verify -verbose -certs "$AAB_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✓ Assinatura verificada com sucesso!${NC}\n"
        echo -e "${GREEN}Arquivo pronto para upload na Play Store:${NC}"
        echo -e "${GREEN}  ${AAB_FILE}${NC}\n"
    else
        echo -e "\n${RED}⚠ Erro na verificação da assinatura${NC}"
        exit 1
    fi
else
    echo -e "\n${RED}✗ Erro ao assinar AAB${NC}"
    echo -e "${YELLOW}Restaurando backup...${NC}"
    mv "$BACKUP_FILE" "$AAB_FILE"
    exit 1
fi

