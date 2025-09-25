#!/bin/bash

# --- Script de Inicio ---
# Este script ahora solo instala dependencias y ejecuta el bot.
# La auto-actualización ha sido deshabilitada para permitir cambios locales.

echo ">>> [Paso 1/2] Instalando/actualizando dependencias de Node.js..."
npm install --silent

echo ">>> [Paso 2/2] Iniciando el bot..."
node index.js