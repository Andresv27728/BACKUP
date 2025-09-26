#!/bin/bash

# --- Script de Inicio y Auto-Actualización desde 'main' ---
# Este script se asegura de que el bot siempre esté ejecutando la última versión
# del código desde la rama 'main' de GitHub, descartando cualquier cambio local.

echo ">>> [Paso 1/3] Forzando actualización desde la rama 'main' de GitHub..."

# Descargar los últimos cambios del origen sin intentar fusionar.
git fetch origin

# Forzar el reseteo de la rama local a la versión exacta de origin/main.
# Esto descarta cambios locales y previene errores.
git reset --hard origin/main

# Limpiar cualquier archivo o directorio no rastreado que pueda interferir.
git clean -df

echo ">>> [Paso 2/3] Instalando/actualizando dependencias de Node.js..."
npm install --silent

echo ">>> [Paso 3/3] Iniciando el bot..."
node index.js