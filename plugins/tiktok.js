import { handleUrlDownload } from '../lib/downloaders.js';

const tiktokCommand = {
  name: "tiktok",
  category: "descargas",
  description: "Descarga un video de TikTok desde un enlace.",
  aliases: ["tt", "tiktokdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de TikTok." }, { quoted: msg });
    }

    try {
      // Usar la función centralizada
      await handleUrlDownload(url, sock, msg);
    } catch (error) {
      console.error("Error en el comando tiktok:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al procesar tu solicitud.` }, { quoted: msg });
    }
  }
};

export default tiktokCommand;
