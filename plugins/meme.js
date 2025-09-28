import axios from 'axios';

// Lista de subreddits de memes en español para obtener variedad
const memeSubreddits = [
  "memesenespanol",
  "SpanishMeme",
  "BuenosMemesEsp",
  "LatinoPeopleTwitter",
  "yo_elvr" // "yo en la vida real"
];

const memeCommand = {
  name: "meme",
  category: "diversion",
  description: "Envía un meme al azar de diferentes fuentes en español.",

  async execute({ sock, msg }) {
    try {
      // 1. Seleccionar un subreddit al azar de la lista
      const randomSubreddit = memeSubreddits[Math.floor(Math.random() * memeSubreddits.length)];

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "😂", key: msg.key } });

      // 2. Llamar a la API con el subreddit seleccionado
      const apiResponse = await axios.get(`https://meme-api.com/gimme/${randomSubreddit}`);
      const meme = apiResponse.data;

      if (!meme || !meme.url) {
        throw new Error(`La API no devolvió una URL válida para el subreddit '${randomSubreddit}'.`);
      }

      // 3. Descargar la imagen y verificar que sea una imagen
      const imageResponse = await axios.get(meme.url, {
        responseType: 'arraybuffer'
      });

      const contentType = imageResponse.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`El enlace del subreddit '${randomSubreddit}' no contenía una imagen (tipo: ${contentType}).`);
      }

      const imageBuffer = Buffer.from(imageResponse.data, 'binary');

      // 4. Enviar la imagen con el título
      await sock.sendMessage(msg.key.remoteJid, {
        image: imageBuffer,
        caption: `*${meme.title}*\n\n_Fuente: r/${meme.subreddit}_`
      }, { quoted: msg });

    } catch (e) {
      console.error("Error en el comando meme:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `No se pudo obtener un meme en este momento. Inténtalo de nuevo.\n*Error:* ${e.message}` }, { quoted: msg });
    }
  }
};

export default memeCommand;