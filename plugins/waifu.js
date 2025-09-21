import { fetchWithRetry } from '../lib/apiHelper.js';
import config from '../config.js';

const waifuCommand = {
  name: "waifu",
  category: "diversion",
  description: "Obtiene una imagen de waifu aleatoria.",

  async execute({ sock, msg }) {
    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: "Buscando una waifu para ti..." }, { quoted: msg });

    try {
      const apiUrl = `${config.api.adonix.baseURL}/waifu/random?apikey=${config.api.adonix.apiKey}`;

      const response = await fetchWithRetry(
        apiUrl,
        { responseType: 'arraybuffer' },
        { retries: 5, silent: true }
      );

      const imageBuffer = response.data;

      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("La API no devolvió una imagen válida.");
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        { image: imageBuffer, caption: "💕" },
        { quoted: msg }
      );

      await sock.deleteMessage(msg.key.remoteJid, waitingMsg.key);

    } catch (error) {
      console.error("Error en el comando waifu:", error.message);
      const errorMessage = "❌ No se pudo obtener una waifu en este momento. El servicio puede no estar disponible.";
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage, edit: waitingMsg.key });
    }
  }
};

export default waifuCommand;
