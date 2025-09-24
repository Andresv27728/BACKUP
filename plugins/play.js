import yts from 'yt-search';
import fetch from 'node-fetch';
import config from '../config.js'; // Assuming config is not in .cjs

// Helper to send reactions
async function doReact(emoji, msg, sock) {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key },
    });
  } catch (e) {
    console.error("Reaction error:", e);
  }
}

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción de YouTube.",
  aliases: ["ytsong", "song", "music"],

  async execute({ sock, msg, args }) {
    await doReact("🎵", msg, sock);
    try {
      const query = args.join(' ');
      if (!query) {
        const replyText = "✨ *GAWR GURA's Music Player* 🎧\n\n" +
          "Dime el nombre de una canción y la busco por ti~ 🦈💙\n\n" +
          "📌 Ejemplo:\n" +
          `• ${config.PREFIX || '.'}play Dandelions\n` +
          `• ${config.PREFIX || '.'}song Shape of You`;
        return await sock.sendMessage(msg.key.remoteJid, { text: replyText }, { quoted: msg });
      }

      await doReact("🔍", msg, sock);
      const search = await yts(query);
      const video = search.videos[0];
      if (!video) {
        const replyText = `❌ No encontré nada para "${query}" 😢\n\n` +
          "Intenta con otro nombre de canción, senpai~ 🦈";
        return await sock.sendMessage(msg.key.remoteJid, { text: replyText }, { quoted: msg });
      }

      const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(video.url)}`;
      const apiRes = await fetch(apiUrl);
      const json = await apiRes.json();
      if (!json.success || !json.result?.download_url) {
        throw new Error("No se pudo obtener el link de descarga de la API.");
      }

      const infoMsg =
        `✨ *GAWR GURA encontró tu canción* 🎶\n\n` +
        `🎵 *Título:* ${video.title}\n` +
        `👤 *Artista:* ${video.author.name}\n` +
        `⏱️ *Duración:* ${video.timestamp}\n` +
        `👁️ *Vistas:* ${video.views.toLocaleString()}\n\n` +
        "Preparando el audio... ⏳";

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          image: { url: video.thumbnail },
          caption: infoMsg,
        },
        { quoted: msg }
      );

      // Como audio
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          audio: { url: json.result.download_url },
          mimetype: 'audio/mpeg',
          fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`,
        },
        { quoted: msg }
      );

      // Como documento
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          document: { url: json.result.download_url },
          mimetype: 'audio/mpeg',
          fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`,
        },
        { quoted: msg }
      );

      await doReact("✅", msg, sock);
    } catch (e) {
      console.error("Play error:", e);
      const errorText = "❌ *Oh no!* 🥺\n\n" +
        `Error: ${e.message || "Fallo en la descarga"}\n\n` +
        "Intenta con otra canción~ 💙";
      await sock.sendMessage(msg.key.remoteJid, { text: errorText }, { quoted: msg });
    }
  }
};

export default playCommand;
