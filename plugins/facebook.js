import { handleUrlDownload } from '../lib/downloaders.js';

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb", "fbdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de Facebook." }, { quoted: msg });
    }

    try {
      // Usar la función centralizada
      await handleUrlDownload(url, sock, msg);
    } catch (error) {
      console.error("Error en el comando facebook:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al procesar tu solicitud.` }, { quoted: msg });
    }
  }
};

export default facebookCommand;
