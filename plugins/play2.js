import fetch from "node-fetch";
import yts from 'yt-search';
import axios from 'axios';

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/;

const play2Command = {
  name: "play2",
  category: "descargas",
  description: "Busca y descarga un video de YouTube y lo envía como video.",
  aliases: ["ytmp4"],

  async execute({ sock, msg, args }) {
    const text = args.join(' ').trim();
    try {
      if (!text) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, ingresa el nombre o link del video." }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⌛", key: msg.key } });

      let videoIdToFind = text.match(youtubeRegexID) || null;
      let searchResult = await yts(videoIdToFind === null ? text : 'https://youtu.be/' + videoIdToFind[1]);

      let videoInfo = null;
      if (videoIdToFind) {
        const videoId = videoIdToFind[1];
        videoInfo = searchResult.all.find(item => item.videoId === videoId) || searchResult.videos.find(item => item.videoId === videoId);
      }
      videoInfo = videoInfo || searchResult.all?.[0] || searchResult.videos?.[0] || searchResult;

      if (!videoInfo || videoInfo.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: 'No se encontraron resultados para tu búsqueda.' }, { quoted: msg });
      }

      const { title, thumbnail, url } = videoInfo;

      const apis = [
        { name: 'ZenzzXD', endpoint: `https://api.zenzxz.my.id/downloader/ytmp4?url=${encodeURIComponent(url)}`, extractor: res => res.download_url },
        { name: 'ZenzzXD v2', endpoint: `https://api.zenzxz.my.id/downloader/ytmp4v2?url=${encodeURIComponent(url)}`, extractor: res => res.download_url },
        { name: 'Vreden', endpoint: `https://api.vreden.my.id/api/ytmp4?url=${encodeURIComponent(url)}`, extractor: res => res.result?.download?.url },
        { name: 'Delirius', endpoint: `https://api.delirius.my.id/download/ymp4?url=${encodeURIComponent(url)}`, extractor: res => res.data?.download?.url }
      ];

      let success = false;
      for (let fuente of apis) {
        try {
          const res = await fetch(fuente.endpoint);
          const data = await res.json();
          const downloadUrl = fuente.extractor(data);
          const videoTitle = data.title || title;

          if (downloadUrl) {
            const videoResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const videoBuffer = videoResponse.data;

            await sock.sendMessage(
              msg.key.remoteJid,
              {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: `${videoTitle} | (API: ${fuente.name})`
              },
              { quoted: msg }
            );
            success = true;
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
            break;
          }
        } catch (err) {
          console.log(`Error con la API ${fuente.name}:`, err.message);
        }
      }

      if (!success) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: 'No se pudo enviar el video desde ninguna de las APIs disponibles.' }, { quoted: msg });
      }
    } catch (error) {
      console.error("Error en el comando play2:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      return sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error inesperado: ${error.message}` }, { quoted: msg });
    }
  }
};

export default play2Command;
