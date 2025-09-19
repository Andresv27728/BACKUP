import yts from 'yt-search';
import axios from 'axios';
import { readUsersDb, writeUsersDb } from './database.js';

const COST = 400;

/**
 * Busca y descarga los medios de un artista (audio o video).
 * @param {object} params - Parámetros de la función.
 * @param {object} params.sock - El socket de la conexión.
 * @param {object} params.msg - El objeto del mensaje.
 * @param {string[]} params.args - Los argumentos del comando.
 * @param {string} params.commandName - El nombre del comando que se está ejecutando.
 * @param {object} params.downloadingState - El objeto que contiene el estado de la descarga.
 * @param {object} params.apiConfig - La configuración de la API a utilizar (baseURL y apiKey).
 * @param {string} params.format - El formato a descargar ('audio' or 'video').
 */
export async function downloadArtistMedia({ sock, msg, args, commandName, downloadingState, apiConfig, format }) {
  const senderId = msg.sender;
  const usersDb = readUsersDb();
  const user = usersDb[senderId];

  if (!user) {
    return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
  }

  if ((user.coins || 0) < COST) {
    return sock.sendMessage(msg.key.remoteJid, { text: `⚠️ No tienes suficientes coins para usar este comando. Necesitas ${COST} coins y solo tienes ${user.coins || 0}.` }, { quoted: msg });
  }

  if (downloadingState.isDownloading) {
    return sock.sendMessage(msg.key.remoteJid, { text: `⚠️ ¡Ya hay una descarga del comando ${commandName} en curso! Por favor, espera a que termine.` }, { quoted: msg });
  }

  const artistName = args.join(' ');
  if (!artistName) {
    return sock.sendMessage(msg.key.remoteJid, { text: "💡 Debes proporcionar el nombre de un artista." }, { quoted: msg });
  }

  // Cobrar al usuario
  user.coins -= COST;
  writeUsersDb(usersDb);
  await sock.sendMessage(msg.key.remoteJid, { text: `💸 Se han descontado ${COST} coins por usar el comando *${commandName}*.` }, { quoted: msg });

  downloadingState.isDownloading = true;
  let waitingMsg;
  const downloadedMedia = [];
  const mediaType = format === 'video' ? 'videos' : 'canciones';

  try {
    waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔔 Buscando los mejores ${mediaType} de *${artistName}*...` }, { quoted: msg });

    const searchResults = await yts(artistName);
    const items = searchResults.videos.slice(0, 50);

    if (!items.length) {
      throw new Error(`No se encontraron resultados para ese artista.`);
    }

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontrados ${items.length} ${mediaType}. Iniciando descargas...` }, { edit: waitingMsg.key });

    for (const item of items) {
      try {
        const { url, title } = item;

        const apiUrl = `${apiConfig.baseURL}/download/yt?apikey=${apiConfig.apiKey}&url=${encodeURIComponent(url)}&format=${format}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const result = response.data;

        if (!result.status || result.status !== 'true' || !result.data || !result.data.url) {
          console.error(`API no devolvió un enlace válido para "${title}". Saltando.`);
          continue;
        }

        const downloadUrl = result.data.url;
        const mediaBuffer = (await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 60000 })).data;

        if (mediaBuffer && mediaBuffer.length > 0) {
          if (format === 'audio') {
            await sock.sendMessage(msg.key.remoteJid, { audio: mediaBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });
          } else {
            await sock.sendMessage(msg.key.remoteJid, { video: mediaBuffer, mimetype: 'video/mp4', caption: title }, { quoted: msg });
          }
          downloadedMedia.push(title);
        }
      } catch (downloadError) {
        console.error(`Error descargando "${item.title}" en ${commandName}:`, downloadError.message);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    let summary = `✅ *Proceso de ${commandName} finalizado.*`;
    if (downloadedMedia.length > 0) {
      summary += `\n\n*${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} descargados:*\n`;
      summary += downloadedMedia.map((media, index) => `${index + 1}. ${media}`).join('\n');
    } else {
      summary += `\n\nNo se pudo descargar ningún ${mediaType}.`;
    }
    await sock.sendMessage(msg.key.remoteJid, { text: summary }, { quoted: msg });

  } catch (error) {
    console.error(`Error en el comando ${commandName}:`, error);
    // Si hay un error, devolver las coins
    user.coins += COST;
    writeUsersDb(usersDb);
    const errorText = `❌ *Error general en ${commandName}:* ${error.message}\n\nSe te han devuelto tus ${COST} coins.`;
    if (waitingMsg) {
      await sock.sendMessage(msg.key.remoteJid, { text: errorText }, { edit: waitingMsg.key });
    } else {
      await sock.sendMessage(msg.key.remoteJid, { text: errorText }, { quoted: msg });
    }
  } finally {
    downloadingState.isDownloading = false;
  }
}
