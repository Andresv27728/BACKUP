import { fetchWithRetry } from '../lib/apiHelper.js';
import config from '../config.js';

const videoiaCommand = {
  name: "videoia",
  category: "ia",
  description: "Genera un video a partir de un texto usando IA.",
  aliases: ["vidia"],

  async execute({ sock, msg, args }) {
    const prompt = args.join(' ');

    if (!prompt) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un texto para generar el video." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Generando tu video con IA... 🎥\n\nEste proceso puede tardar varios minutos, por favor ten paciencia.` }, { quoted: msg });

    try {
      const apiUrl = `${config.api.adonix.baseURL}/ai/veo3?apikey=${config.api.adonix.apiKey}&prompt=${encodeURIComponent(prompt)}`;

      // Usamos un timeout largo porque la IA puede tardar
      const response = await fetchWithRetry(apiUrl, { timeout: 300000 }); // 5 minutos de timeout

      if (!response.data.status || !response.data.video) {
        throw new Error('La API no devolvió un video válido.');
      }

      const videoUrl = response.data.video;

      // Descargar el buffer del video para más robustez
      const videoResponse = await fetchWithRetry(videoUrl, { responseType: 'arraybuffer' });
      const videoBuffer = videoResponse.data;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: videoBuffer,
          caption: `✨ ¡Aquí tienes tu video generado por IA!\n\n*Prompt:* ${prompt}`,
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      );

      await sock.deleteMessage(msg.key.remoteJid, waitingMsg.key);

    } catch (error) {
      console.error("Error en el comando videoia:", error.message);
      const errorMessage = "❌ No se pudo generar el video. El servicio de IA puede estar ocupado o hubo un error. Por favor, inténtalo de nuevo más tarde.";
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage, edit: waitingMsg.key });
    }
  }
};

export default videoiaCommand;
