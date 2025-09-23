import fetch from 'node-fetch';
import config from '../config.js';

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3).",
  aliases: ["playaudio"],

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de una canción." }, { quoted: msg });
    }

    const query = args.join(' ');
    await sock.sendMessage(msg.key.remoteJid, { text: `Buscando "${query}"...` }, { quoted: msg });

    try {
      // --- PASO 1: Buscar el video ---
      const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(query)}`;
      const searchResponse = await fetch(searchApi);
      const searchData = await searchResponse.json();

      if (!searchData?.data || searchData.data.length === 0) {
        throw new Error(`No se encontraron resultados de video para "${query}".`);
      }

      const video = searchData.data[0];
      const videoTitle = video.title;

      // --- PASO 2: Descargar el audio usando el título ---
      const downloadApi = `https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(videoTitle)}`;
      const downloadResponse = await fetch(downloadApi);
      const downloadData = await downloadResponse.json();

      if (!downloadData?.result?.download?.url) {
        if (downloadData?.result?.msg) {
          throw new Error(`No se pudo obtener el audio. API dice: ${downloadData.result.msg}`);
        }
        throw new Error("No se pudo obtener la URL de descarga del audio.");
      }

      const audioUrl = downloadData.result.download.url;

      const audioRes = await fetch(audioUrl);
      const audioBuffer = await audioRes.arrayBuffer();

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("No se pudo obtener el audio de la URL de descarga.");
      }

      // --- PASO 3: Enviar los mensajes ---
      await sock.sendMessage(msg.key.remoteJid, { text: `Descargando: *${videoTitle}*` }, { quoted: msg });

      // Enviar como audio reproducible
      await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });

      // Enviar como documento
      await sock.sendMessage(msg.key.remoteJid, { document: audioBuffer, mimetype: 'audio/mpeg', fileName: `${videoTitle}.mp3` }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando play:", error);
      const errorMessage = `❌ No se pudo descargar la canción. Detalle: ${error.message}`;
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};

export default playCommand;
