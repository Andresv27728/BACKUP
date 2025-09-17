import axios from 'axios';
import config from '../config.js';

const tiktokSearchCommand = {
  name: "tiktoksearch",
  category: "busquedas",
  description: "Busca videos en TikTok y envía el primer resultado.",
  aliases: ["ttksearch"],

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un término de búsqueda." }, { quoted: msg });
    }

    const query = args.join(' ');
    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔎 Buscando "${query}" en TikTok...` }, { quoted: msg });

    try {
      const apiUrl = `https://myapiadonix.casacam.net/search/tiktok?apikey=${config.api.adonix}&q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      if (!response.data || !response.data.status || !response.data.result || response.data.result.length === 0) {
        throw new Error("No se encontraron resultados o la respuesta de la API no es válida.");
      }

      const video = response.data.result[0];

      // Formatear estadísticas
      const formatCount = (num) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toString();
      };

      const caption = `
*TikTok Search*

*Título:* ${video.title || 'Sin título'}
*Autor:* @${video.author.unique_id} (${video.author.nickname})

*Estadísticas:*
❤️ *Likes:* ${formatCount(video.digg_count)}
💬 *Comentarios:* ${formatCount(video.comment_count)}
🔁 *Shares:* ${formatCount(video.share_count)}
▶️ *Vistas:* ${formatCount(video.play_count)}
      `;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: video.play },
          caption: caption.trim(),
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      );

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ ¡Video encontrado y enviado!`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando tiktoksearch:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al buscar en TikTok.`, edit: waitingMsg.key });
    }
  }
};

export default tiktokSearchCommand;
