import yts from 'yt-search';
import axios from 'axios';

/**
 * Busca y descarga las canciones de un artista usando una API específica.
 * @param {object} params - Parámetros de la función.
 * @param {object} params.sock - El socket de la conexión.
 * @param {object} params.msg - El objeto del mensaje.
 * @param {string[]} params.args - Los argumentos del comando.
 * @param {string} params.commandName - El nombre del comando que se está ejecutando.
 * @param {object} params.downloadingState - El objeto que contiene el estado de la descarga.
 * @param {object} params.apiConfig - La configuración de la API a utilizar (baseURL y apiKey).
 */
export async function downloadArtistSongs({ sock, msg, args, commandName, downloadingState, apiConfig }) {
  if (downloadingState.isDownloading) {
    return sock.sendMessage(msg.key.remoteJid, { text: `⚠️ ¡Ya hay una descarga del comando ${commandName} en curso! Por favor, espera a que termine.` }, { quoted: msg });
  }

  const artistName = args.join(' ');
  if (!artistName) {
    return sock.sendMessage(msg.key.remoteJid, { text: "💡 Debes proporcionar el nombre de un artista." }, { quoted: msg });
  }

  downloadingState.isDownloading = true;
  let waitingMsg;
  const downloadedSongs = [];

  try {
    waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔔 Buscando las mejores canciones de *${artistName}*...` }, { quoted: msg });

    const searchResults = await yts(artistName);
    const videos = searchResults.videos.slice(0, 50);

    if (!videos.length) {
      throw new Error("No se encontraron resultados para ese artista.");
    }

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontradas ${videos.length} canciones. Iniciando descargas...` }, { edit: waitingMsg.key });

    for (const video of videos) {
      try {
        const { url, title } = video;

        const apiUrl = `${apiConfig.baseURL}/download/yt?apikey=${apiConfig.apiKey}&url=${encodeURIComponent(url)}&format=audio`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const result = response.data;

        if (!result.status || result.status !== 'true' || !result.data || !result.data.url) {
          console.error(`API no devolvió un enlace válido para "${title}". Saltando.`);
          continue;
        }

        const downloadUrl = result.data.url;
        const audioBuffer = (await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 60000 })).data;

        if (audioBuffer && audioBuffer.length > 0) {
          await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });
          downloadedSongs.push(title);
        }
      } catch (downloadError) {
        console.error(`Error descargando "${video.title}" en ${commandName}:`, downloadError.message);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    let summary = `✅ *Proceso de ${commandName} finalizado.*`;
    if (downloadedSongs.length > 0) {
      summary += "\n\n*Canciones descargadas:*\n";
      summary += downloadedSongs.map((song, index) => `${index + 1}. ${song}`).join('\n');
    } else {
      summary += "\n\nNo se pudo descargar ninguna canción.";
    }
    await sock.sendMessage(msg.key.remoteJid, { text: summary }, { quoted: msg });

  } catch (error) {
    console.error(`Error en el comando ${commandName}:`, error);
    const errorText = `❌ *Error general en ${commandName}:* ${error.message}`;
    if (waitingMsg) {
      await sock.sendMessage(msg.key.remoteJid, { text: errorText }, { edit: waitingMsg.key });
    } else {
      await sock.sendMessage(msg.key.remoteJid, { text: errorText }, { quoted: msg });
    }
  } finally {
    downloadingState.isDownloading = false;
  }
}
