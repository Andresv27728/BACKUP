import yts from 'yt-search';
import axios from 'axios';
import config from '../config.js';

const play2Command = {
  name: "play2",
  category: "descargas",
  description: "Busca y descarga un video en formato MP4.",

  async execute({ sock, msg, args }) {
    if (args.length === 0) return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de un video." }, { quoted: msg });

    const query = args.join(' ');
    let waitingMsg;

    try {
      waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🎶 Buscando "${query}"...` }, { quoted: msg });

      const searchResults = await yts(query);
      if (!searchResults.videos.length) throw new Error("No se encontraron resultados.");

      const videoInfo = searchResults.videos[0];
      const { title, url } = videoInfo;

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontrado: *${title}*.\n\n⬇️ Descargando video...` }, { edit: waitingMsg.key });

      const apiUrl = `https://myapiadonix.casacam.net/download/yt?apikey=${config.api.adonix}&url=${encodeURIComponent(url)}&format=video`;

      const response = await axios.get(apiUrl);
      const result = response.data;

      if (!result.status || result.status !== 'true' || !result.data || !result.data.url) {
          throw new Error("La API no devolvió un enlace de descarga válido o indicó un error.");
      }

      const downloadUrl = result.data.url;

      const videoBuffer = (await axios.get(downloadUrl, { responseType: 'arraybuffer' })).data;

      if (!videoBuffer) throw new Error("El buffer de video está vacío.");

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Descarga completada. Enviando video...` }, { edit: waitingMsg.key });

      await sock.sendMessage(msg.key.remoteJid, { video: videoBuffer, mimetype: 'video/mp4', caption: title }, { quoted: msg });

    } catch (error) {
      console.error("Error final en play2:", error);
      const errorMsg = { text: `❌ ${error.message}` };
       if (waitingMsg) {
        await sock.sendMessage(msg.key.remoteJid, { ...errorMsg, edit: waitingMsg.key });
      } else {
        await sock.sendMessage(msg.key.remoteJid, errorMsg, { quoted: msg });
      }
    }
  }
};

export default play2Command;
