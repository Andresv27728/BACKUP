// Este es el manejador de mensajes que usarán los sub-bots y el bot principal.
import { commands, aliases, testCache, cooldowns } from './index.js';
import config from './config.js';
import { readSettingsDb, readMaintenanceDb } from './lib/database.js';
import { handleUrlDownload } from './lib/downloaders.js';
import print from './lib/print.js';

const COOLDOWN_SECONDS = 5;
const RESPONSE_DELAY_MS = 2000;

export async function handler(m, isSubBot = false) { // Se añade isSubBot para diferenciar
  const sock = this;

  try {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

  // Pretty print message to console
  try { await print(msg, sock); } catch {}

    const senderId = msg.key.participant || msg.key.remoteJid;
    msg.sender = senderId; // Adjuntar para fácil acceso

    const from = msg.key.remoteJid;
    let body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    const settings = readSettingsDb();
    const groupPrefix = from.endsWith('@g.us') ? settings[from]?.prefix : null;
    const globalPrefix = config.prefix; // Asumiendo que podría haber un prefijo global en config

    // --- Lógica de Auto-Descarga ---
    const isGroup = from.endsWith('@g.us');
    const isCommand = (groupPrefix && body.startsWith(groupPrefix)) || (globalPrefix && body.startsWith(globalPrefix));

    if (isGroup && !isCommand && settings[from]?.autodl) {
      const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/i;
      const foundUrl = body.match(URL_REGEX);

      if (foundUrl) {
        const url = foundUrl[0];
        const handled = await handleUrlDownload(url, sock, msg);
        if (handled) {
          return; // Detener el procesamiento si se manejó una URL
        }
      }
    }
    // --- Fin de Lógica de Auto-Descarga ---

    let commandName;
    let args;

    if (groupPrefix) {
      if (!body.startsWith(groupPrefix)) return; // Si no empieza con el prefijo del grupo, no es comando
      body = body.slice(groupPrefix.length);
      args = body.trim().split(/ +/).slice(1);
      commandName = body.trim().split(/ +/)[0].toLowerCase();
    } else {
      // Procesar con prefijo global si existe
      if (globalPrefix && !body.startsWith(globalPrefix)) return;
      if (globalPrefix) body = body.slice(globalPrefix.length);

      args = body.trim().split(/ +/).slice(1);
      commandName = body.trim().split(/ +/)[0].toLowerCase();
    }

    let command = commands.get(commandName) || commands.get(aliases.get(commandName));

    if (command) {
      const senderNumber = senderId.split('@')[0];
      const isOwner = config.ownerNumbers.includes(senderNumber);

      // Lógica de Permisos Corregida
      if (command.category === 'propietario' && !isOwner) {
        return sock.sendMessage(from, { text: "Este comando es solo para el propietario del bot." });
      }
      if (command.category === 'subbots' && !isOwner) {
        // En un futuro, aquí se podría comprobar una lista de usuarios autorizados
        return sock.sendMessage(from, { text: "No tienes permiso para gestionar sub-bots." });
      }
      // Los sub-bots no pueden usar comandos de propietario/sub-bots
      if (isSubBot && (command.category === 'propietario' || command.category === 'subbots')) {
        return sock.sendMessage(from, { text: "Un sub-bot no puede usar este comando." });
      }

      // Cooldown
      if (cooldowns.has(senderId)) {
        const timeDiff = (Date.now() - cooldowns.get(senderId)) / 1000;
        if (timeDiff < COOLDOWN_SECONDS) return;
      }

      // Verificación de Mantenimiento
      const maintenanceList = readMaintenanceDb();
      if (maintenanceList.includes(commandName) && !isOwner) {
        return sock.sendMessage(from, { text: "🛠️ Este comando está actualmente en mantenimiento. Por favor, inténtalo más tarde." });
      }

      // Ejecución
      try {
        await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY_MS));
        await command.execute({ sock, msg, args, commands, config, testCache, isOwner });
        cooldowns.set(senderId, Date.now());
      } catch (error) {
        console.error(`Error en comando ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'Ocurrió un error al ejecutar ese comando.' });
      }
    }
  } catch (e) {
    console.error("Error en el manejador de mensajes:", e);
  }
}
