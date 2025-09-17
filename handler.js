// Este es el manejador de mensajes que usarán los sub-bots y el bot principal.
import { commands, aliases, testCache, cooldowns } from './index.js';
import config from './config.js';
import { readSettingsDb, readMaintenanceDb } from './lib/database.js';
import print from './lib/print.js';
import axios from 'axios';
import { facebookDl, instagramDl } from './lib/scraper.js';

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

    // --- Lógica de Auto-Descarga ---
    const settings = readSettingsDb();
    const isGroup = from.endsWith('@g.us');

    if (isGroup && settings[from]?.autoDl) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = body.match(urlRegex);

      if (urls && urls.length > 0) {
        const url = urls[0];
        let downloadUrl;
        let downloaderName = '';

        try {
          // Regex para cada plataforma
          const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:shorts\/)?([\w-]{11})/;
          const fbRegex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;
          const igRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[^\s]+/i;

          if (ytRegex.test(url)) {
            downloaderName = 'YouTube';
            const apiResponse = await axios.get(`https://myapiadonix.casacam.net/download/yt?apikey=AdonixKeyvomkuv5056&url=${encodeURIComponent(url)}&format=video`);
            if (apiResponse.data?.status === 'true' && apiResponse.data?.data?.url) {
              downloadUrl = apiResponse.data.data.url;
            } else {
              throw new Error("La API de YouTube no devolvió un enlace válido.");
            }
          } else if (fbRegex.test(url)) {
            downloaderName = 'Facebook';
            const fbLinks = await facebookDl(url);
            downloadUrl = fbLinks?.['HD'] || fbLinks?.['SD'];
             if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga de Facebook.");
          } else if (igRegex.test(url)) {
            downloaderName = 'Instagram';
            downloadUrl = await instagramDl(url);
            if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga de Instagram.");
          }

          if (downloadUrl) {
            await sock.sendMessage(from, { text: `📥 Descargando video de ${downloaderName}...` }, { quoted: msg });
            await sock.sendMessage(from, { video: { url: downloadUrl }, mimetype: 'video/mp4' }, { quoted: msg });
            return; // Detener el procesamiento para no tratarlo como comando
          }
        } catch (e) {
          console.error(`Error en Auto-Descarga (${downloaderName}):`, e.message);
          // Opcional: enviar un mensaje de error silencioso o no enviar nada
          // await sock.sendMessage(from, { text: `❌ Error al auto-descargar de ${downloaderName}.` }, { quoted: msg });
        }
      }
    }

    const groupPrefix = from.endsWith('@g.us') ? settings[from]?.prefix : null;

    let commandName;
    let args;

    if (groupPrefix) {
      if (!body.startsWith(groupPrefix)) return;
      body = body.slice(groupPrefix.length);
      args = body.trim().split(/ +/).slice(1);
      commandName = body.trim().split(/ +/)[0].toLowerCase();
    } else {
      // Si hay prefijo global o si no hay prefijo de grupo, procesar normal
      const globalPrefix = config.prefix; // Asumiendo que podría haber un prefijo global en config
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
