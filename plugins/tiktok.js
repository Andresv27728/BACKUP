import fg from 'api-dylux';
import { logDownload } from '../lib/logging.js';

const tiktokCommand = {
  name: "tiktok",
  category: "downloader",
  description: "Descarga un video de TikTok desde un enlace.",
  aliases: ["tt", "ttdl"],

  async execute({ sock, msg, args, text }) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de TikTok para descargar el video." }, { quoted: msg });
    }

    if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok\.com\/([^\s&]+)/gi.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "El enlace de TikTok que proporcionaste no es válido. Por favor, verifica el enlace e inténtalo de nuevo." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⌛", key: msg.key } });

      let data = await fg.tiktok(url);
      let { title, play, duration } = data.result;
      let { nickname } = data.result.author;

      let caption = `*Descarga de TikTok*\n\n*Título:* ${title}\n*Autor:* @${nickname}\n*Duración:* ${duration}`.trim();

      const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
        video: { url: play },
        caption
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

      await logDownload(sock, msg, sentMsg);

    } catch (e) {
      console.error("Error en el comando tiktok:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al descargar el video de TikTok. Por favor, inténtalo de nuevo más tarde.\n\n*Detalles:* ${e.message}` }, { quoted: msg });
    }
  }
};

export default tiktokCommand;
