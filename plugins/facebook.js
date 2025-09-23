import { igdl } from 'ruhend-scraper';
import { logDownload } from '../lib/logging.js';

const facebookCommand = {
  name: "facebook",
  category: "downloader",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb", "fbdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de Facebook para descargar el video." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: "Procesando tu video de Facebook... por favor espera." }, { quoted: msg });

      const res = await igdl(url);
      const result = res.data;

      if (!result || result.length === 0) {
        throw new Error("No se encontraron resultados o el enlace es inválido.");
      }

      const data = result.find(i => i.resolution === "720p (HD)") || result.find(i => i.resolution === "360p (SD)");

      if (!data || !data.url) {
        throw new Error("No se encontró una resolución de video adecuada para descargar.");
      }

      const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
        video: { url: data.url },
        caption: "Aquí tienes tu video de Facebook.",
        mimetype: 'video/mp4'
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

      await logDownload(sock, msg, sentMsg);

    } catch (e) {
      console.error("Error en el comando facebook:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚠️", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al descargar el video. Por favor, verifica que el enlace sea correcto y público.\n\n*Detalles:* ${e.message}` }, { quoted: msg });
    }
  }
};

export default facebookCommand;
