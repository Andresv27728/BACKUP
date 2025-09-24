import fetch from "node-fetch";
import yts from "yt-search";
import axios from "axios";

// Helper object for the downloader API
const ddownr = {
  download: async (url, format) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    const response = await axios.request(config);
    if (response.data && response.data.success) {
      const { id } = response.data;
      const downloadUrl = await ddownr.cekProgress(id);
      return downloadUrl;
    }
    throw new Error('Fallo al obtener los detalles del video.');
  },

  cekProgress: async (id) => {
    const config = {
      method: 'GET',
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    while (true) {
      const response = await axios.request(config);
      if (response.data && response.data.success && response.data.progress === 1000) {
        return response.data.download_url;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción de YouTube.",
  aliases: ["ytmp3"],

  async execute({ sock, msg, args }) {
    const text = args.join(' ').trim();
    try {
      if (!text) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, ingresa el nombre de una canción para buscar." }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🔎", key: msg.key } });

      const search = await yts(text);
      if (!search.all || search.all.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: 'No se encontraron resultados para tu búsqueda.' }, { quoted: msg });
      }

      const videoInfo = search.all[0];
      const { title, url } = videoInfo;

      await sock.sendMessage(msg.key.remoteJid, { text: `Descargando: *${title}*`}, { quoted: msg });

      const downloadUrl = await ddownr.download(url, 'mp3');

      if (downloadUrl) {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg'
          },
          { quoted: msg }
        );
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener un enlace de descarga." }, { quoted: msg });
      }
    } catch (error) {
      console.error("Error en el comando play:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      return sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error inesperado: ${error.message}` }, { quoted: msg });
    }
  }
};

export default playCommand;
