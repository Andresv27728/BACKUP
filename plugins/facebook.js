import { fetchWithRetry } from '../lib/apiHelper.js';
import config from '../config.js';

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb", "fbdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const fbRegex = /https?:\/\/(www\.|web\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;

    if (!url || !fbRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de Facebook." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔱 Swimming for your video... 🌊` }, { quoted: msg });

    try {
      const apiUrl = `${config.api.adonix.baseURL}/download/facebook?apikey=${config.api.adonix.apiKey}&url=${encodeURIComponent(url)}`;
      const response = await fetchWithRetry(apiUrl);
      const data = response.data;

      if (!data.status || !data.result || !data.result.media) {
        throw new Error("La respuesta de la API no es válida o no contiene medios.");
      }

      const media = data.result.media;
      const downloadUrl = media.video_hd || media.video_sd;

      if (!downloadUrl) {
        throw new Error("No se pudo obtener la URL de descarga del video desde la API.");
      }

      const videoResponse = await fetchWithRetry(downloadUrl, { responseType: 'arraybuffer' });
      const videoBuffer = videoResponse.data;
      const caption = data.result.info.title || "¡Aquí tienes tu video de Facebook!";

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: videoBuffer,
          caption: caption,
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      );

      // Eliminar el mensaje de "Procesando..."
      try {
        await sock.deleteMessage(msg.key.remoteJid, waitingMsg.key);
      } catch (deleteError) {
        console.error("Error al eliminar el mensaje de espera:", deleteError);
      }

    } catch (error) {
      console.error("Error en el comando facebook:", error.message);
      const errorMessage = "❌ No se pudo descargar el video de Facebook. El servicio puede no estar disponible o el enlace ser inválido. Por favor, inténtalo de nuevo más tarde.";
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage, edit: waitingMsg.key });
    }
  }
};

export default facebookCommand;
