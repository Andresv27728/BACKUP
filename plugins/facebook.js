import { facebookDl } from '../lib/scraper.js';

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb", "fbdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const fbRegex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;

    if (!url || !fbRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de Facebook." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🌊 Procesando tu video...` }, { quoted: msg });

    try {
      const links = await facebookDl(url);
      if (!links || Object.keys(links).length === 0) {
        throw new Error("No se pudieron obtener los enlaces de descarga.");
      }

      // Prioritize HD over SD
      const downloadUrl = links['HD'] || links['SD'];

      if (!downloadUrl) {
        throw new Error("No se pudo obtener la URL de descarga del video.");
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: downloadUrl },
          caption: `✨ ¡Aquí tienes tu video de Facebook!`,
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      );

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ ¡Video enviado!`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando facebook:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error. El enlace puede ser inválido, privado o el servicio de descarga estar fallando.`, edit: waitingMsg.key, quoted: msg });
    }
  }
};

export default facebookCommand;
