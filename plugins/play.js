import yts from 'yt-search';
import axios from 'axios';
import config from '../config.js';
import { fetchWithRetry } from '../lib/apiHelper.js';

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3).",

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de una canción." }, { quoted: msg });
    }

    const query = args.join(' ');

    try {
      const searchResults = await yts(query);
      if (!searchResults.videos.length) {
        throw new Error("No se encontraron resultados.");
      }

      const videoInfo = searchResults.videos[0];
      const originalTitle = videoInfo.title;
      const url = videoInfo.url;

      const apiUrl = `${config.api.adonix.baseURL}/download/ytmp3?apikey=${config.api.adonix.apiKey}&url=${encodeURIComponent(url)}`;
      console.log(`[play] Calling API: ${apiUrl}`);

      const response = await fetchWithRetry(apiUrl);
      const result = response.data;
      console.log('[play] API Response:', JSON.stringify(result, null, 2));

      if (!result.status || !result.data || !result.data.url) {
        throw new Error("La API no devolvió un enlace de descarga válido o indicó un error.");
      }

      const downloadUrl = result.data.url;
      const title = result.data.title || originalTitle;

      const audioResponse = await fetchWithRetry(downloadUrl, { responseType: 'arraybuffer' });
      const audioBuffer = audioResponse.data;

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("No se pudo obtener el audio de la API.");
      }

      // Enviar como audio reproducible y luego el título
      await sock.sendMessage(msg.key.remoteJid, { text: `Descargando: *${title}*` }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });

      // Enviar como documento
      await sock.sendMessage(msg.key.remoteJid, { document: audioBuffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando play:", error);
      const errorMessage = "❌ No se pudo descargar la canción. El servicio puede no estar disponible. Por favor, inténtalo de nuevo más tarde.";
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};

export default playCommand;
