import fetch from 'node-fetch';

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción de YouTube.",
  aliases: ["playaudio"],

  async execute({ sock, msg, args }) {
    const text = args.join(' ');
    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, { text: `🌟 Ingresa un nombre para buscar en YouTube.\n\n✨ *Ejemplo:* .play Shakira` }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕛", key: msg.key } });

      // --- PRIMER PASO: BUSCAR VIDEO ---
      const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(text)}`;
      const searchResponse = await fetch(searchApi);
      const searchData = await searchResponse.json();

      if (!searchData?.data || searchData.data.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: `⚠️ No encontré resultados de video en YouTube para *"${text}"*...` }, { quoted: msg });
      }

      const video = searchData.data[0]; // Primer resultado

      // Nuevo waitMessage estilizado
      const waitMessage = `*┏━━━━━━༺❀༻━━━━━━┓*
*┃* ✨ *Nombre:* ${video.title}
*┃* 🧚‍♀️ *Artista:* ${video.author.name}
*┃* ⌛ *Duración:* ${video.duration}
*┃* 👁 *Vistas:* ${video.views}
*┗━━━━━━༺❀༻━━━━━━┛*

> ☁️ *Estamos preparando tu audio, espera tantito...*`;

      // Enviamos miniatura con mensaje
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: video.image },
        caption: waitMessage.trim(),
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: "☕︎︎ 𝘔𝘢𝘪 • 𝑊𝑜𝑟𝑙𝑑 𝑂𝑓 𝐶𝑢𝑡𝑒 🍁",
            body: "✐ 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖡𝗒 𝖶𝗂𝗋𝗄 🌵",
            thumbnailUrl: video.image,
            mediaUrl: "https://chat.whatsapp.com/KqkJwla1aq1LgaPiuFFtEY",
            mediaType: 2,
            showAdAttribution: true,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });

      // --- SEGUNDO PASO: DESCARGAR AUDIO ---
      const downloadApi = `https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(video.title)}`;
      const downloadResponse = await fetch(downloadApi);
      const downloadData = await downloadResponse.json();

      if (!downloadData?.result?.download?.url) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        if (downloadData?.result?.msg) {
          return sock.sendMessage(msg.key.remoteJid, { text: `❌ No se pudo obtener el audio del video usando el título. Error de la API: ${downloadData.result.msg}` }, { quoted: msg });
        }
        return sock.sendMessage(msg.key.remoteJid, { text: "❌ No se pudo obtener el audio del video." }, { quoted: msg });
      }

      const audioUrl = downloadData.result.download.url;

      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `🎵 ${video.title}.mp3`,
        contextInfo: {
          forwardingScore: 9,
          isForwarded: true
        }
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al procesar tu solicitud:\n${error.message}` }, { quoted: msg });
    }
  }
};

export default playCommand;
