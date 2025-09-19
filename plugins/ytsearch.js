import yts from 'yt-search';

const ytsearchCommand = {
  name: "ytsearch",
  category: "busquedas",
  description: "Busca los 10 videos más relevantes en YouTube.",

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un término de búsqueda." }, { quoted: msg });
    }

    const query = args.join(' ');

    try {
      const searchResults = await yts(query);
      const videos = searchResults.videos.slice(0, 10);

      if (videos.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { quoted: msg });
      }

      let responseText = `*Resultados de la búsqueda para "${query}":*\n\n`;

      videos.forEach((video, index) => {
        responseText += `*${index + 1}. ${video.title}*\n`;
        responseText += `*Autor:* ${video.author.name}\n`;
        responseText += `*Duración:* ${video.timestamp}\n`;
        responseText += `*URL:* ${video.url}\n\n`;
      });

      await sock.sendMessage(msg.key.remoteJid, { text: responseText.trim() }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando ytsearch:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Ocurrió un error al realizar la búsqueda." }, { quoted: msg });
    }
  }
};

export default ytsearchCommand;
