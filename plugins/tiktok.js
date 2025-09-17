import axios from 'axios';

const tiktokCommand = {
  name: "tiktok",
  category: "descargas",
  description: "Descarga un video de TikTok desde un enlace.",
  aliases: ["tt", "tiktokdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const tiktokRegex = /https?:\/\/(www\.)?tiktok\.com\/[^\s]+/i;

    if (!url || !tiktokRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de TikTok." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🌊 Procesando tu video de TikTok...` }, { quoted: msg });

    try {
      const apiUrl = `https://myapiadonix.casacam.net/download/tiktok?apikey=AdonixKeyvomkuv5056&url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);

      if (response.data.status !== "true" || !response.data.data || !response.data.data.video) {
        throw new Error('La API no devolvió un video válido o el enlace es incorrecto.');
      }

      const { title, author, video } = response.data.data;
      const videoUrl = video;

      const caption = `*Título:* ${title}\n*Autor:* ${author.name} (@${author.username})`;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: videoUrl },
          caption: caption,
          mimetype: 'video/mp4'
        },
        { quoted: msg }
      );

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ ¡Video enviado!`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando tiktok:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error. ${error.message}`, edit: waitingMsg.key, quoted: msg });
    }
  }
};

export default tiktokCommand;
