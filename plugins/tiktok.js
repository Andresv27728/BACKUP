import { tiktokdl } from '@mrnima/tiktok-downloader';

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
      const result = await tiktokdl(url);
      if (!result || !result.status === 'success' || !result.result || !result.result.video) {
        throw new Error("No se pudo obtener el video de TikTok. El enlace puede ser inválido o el servicio de descarga estar fallando.");
      }

      const videoUrl = result.result.video.nowm;

      if (!videoUrl) {
        throw new Error("No se pudo obtener la URL de descarga del video sin marca de agua.");
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: videoUrl },
          caption: `✨ ¡Aquí tienes tu video de TikTok!`,
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
