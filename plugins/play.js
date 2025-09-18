import yts from 'yt-search';
import { handleUrlDownload } from '../lib/downloaders.js';

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3) desde YouTube.",
  aliases: ["ytplay"],

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre o enlace de una canción de YouTube." }, { quoted: msg });
    }

    const query = args.join(' ');
    const isUrl = query.startsWith('http');

    try {
      let videoUrl;
      if (isUrl) {
        videoUrl = query;
      } else {
        const searchResults = await yts(query);
        if (!searchResults.videos.length) {
          return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { quoted: msg });
        }
        videoUrl = searchResults.videos[0].url;
      }

      // Usar la función centralizada
      await handleUrlDownload(videoUrl, sock, msg);

    } catch (error) {
      console.error("Error en el comando play:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al procesar tu solicitud.` }, { quoted: msg });
    }
  }
};

export default playCommand;
