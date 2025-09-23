import fetch from "node-fetch";
import yts from "yt-search";
import axios from "axios";

const formatAudio = ["mp3", "m4a", "webm", "aac", "flac", "opus", "ogg", "wav"];

const ddownr = {
  download: async (url, format) => {
    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    };
    const response = await axios.request(config);
    if (response.data && response.data.success) {
      const { id } = response.data;
      const downloadUrl = await ddownr.cekProgress(id);
      return downloadUrl;
    }
    throw new Error("Fallo al obtener los detalles del video.");
  },
  cekProgress: async (id) => {
    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/91.0.4472.124 Safari/537.36"
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

const apisExtra = [
  {
    name: "Vreden",
    fetchUrl: async (url) => {
      const res = await fetch(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      return data?.result?.download?.url || null;
    }
  },
  {
    name: "ZenzzXD",
    fetchUrl: async (url) => {
      const res = await fetch(`https://api.zenzxz.my.id/downloader/ytmp3?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      return data?.download_url || null;
    }
  },
  {
    name: "ZenzzXD v2",
    fetchUrl: async (url) => {
      const res = await fetch(`https://api.zenzxz.my.id/downloader/ytmp3v2?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      return data?.download_url || null;
    }
  },
  {
    name: "Delirius",
    fetchUrl: async (url) => {
      const res = await fetch(`https://api.delirius.my.id/download/ymp3?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      return data?.data?.download?.url || null;
    }
  }
];

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción y la envía como audio.",
  aliases: ["ytmp3"],

  async execute({ sock, msg, args }) {
    const text = args.join(' ').trim();
    try {
      if (!text) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: "Ingresa el nombre del video a descargar." }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕑", key: msg.key } });

      const search = await yts(text);
      if (!search.all || search.all.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { quoted: msg });
      }

      const videoInfo = search.all[0];
      const { title, url } = videoInfo;
      const format = "mp3";

      let downloadUrl = null;
      try {
        console.log("Intentando con la API principal (ddownr)...");
        downloadUrl = await ddownr.download(url, format);
      } catch (e) {
        console.error("La API principal falló:", e.message);
        console.log("Intentando con las APIs de respaldo...");
        for (let api of apisExtra) {
          try {
            console.log(`- Intentando con ${api.name}...`);
            downloadUrl = await api.fetchUrl(url);
            if (downloadUrl) {
              console.log(`+ Éxito con ${api.name}`);
              break;
            }
          } catch (err) {
            console.error(`- Fallo con ${api.name}:`, err.message);
            continue;
          }
        }
      }

      if (downloadUrl) {
        const audioResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const audioBuffer = audioResponse.data;

        await sock.sendMessage(
          msg.key.remoteJid,
          {
            audio: audioBuffer,
            mimetype: "audio/mpeg"
          },
          { quoted: msg }
        );

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        return sock.sendMessage(msg.key.remoteJid, { text: "No se pudo descargar el audio después de intentar con todas las APIs." }, { quoted: msg });
      }
    } catch (error) {
      console.error("Error en el comando play:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      return sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error: ${error.message}` }, { quoted: msg });
    }
  }
};

export default playCommand;
