import { fetchWithRetry } from '../lib/apiHelper.js';
import config from '../config.js';

const tiktokCommand = {
  name: "tiktok",
  category: "descargas",
  description: "Descarga un video de TikTok desde un enlace.",
  aliases: ["tt", "tiktokdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const tiktokRegex = /https?:\/\/(www\.)?tiktok\.com\/[^\s]+/i;

    if (!url || !tiktokRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de TikTok." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🎶 Dancin' to the video...` }, { quoted: msg });

    try {
      const apiUrl = `${config.api.adonix.baseURL}/download/tiktok?apikey=${config.api.adonix.apiKey}&url=${encodeURIComponent(url)}`;
      const response = await fetchWithRetry(apiUrl);

      if (response.data.status !== "true" || !response.data.data || !response.data.data.video) {
        throw new Error('La API no devolvió un video válido o el enlace es incorrecto.');
      }

      const { title, author, video } = response.data.data;
      const videoUrl = video;

      const videoBuffer = (await fetchWithRetry(videoUrl, { responseType: 'arraybuffer' })).data;
      const caption = `*${title}*\n\n*Autor:* ${author.name} (@${author.username})`;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: videoBuffer,
          caption: caption,
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      );

      await sock.deleteMessage(msg.key.remoteJid, waitingMsg.key);

    } catch (error) {
      console.error("Error en el comando tiktok:", error.message);
      const errorMessage = "❌ No se pudo descargar el video de TikTok. El servicio puede no estar disponible o el enlace ser inválido. Por favor, inténtalo de nuevo más tarde.";
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage, edit: waitingMsg.key });
    }
  }
};

export default tiktokCommand;
