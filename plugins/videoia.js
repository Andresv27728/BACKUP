import axios from 'axios';

const videoiaCommand = {
  name: "videoia",
  category: "ia",
  description: "Genera un video a partir de un texto usando IA.",
  aliases: ["vidia"],

  async execute({ sock, msg, args }) {
    const prompt = args.join(' ');

    if (!prompt) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un texto para generar el video." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Generando tu video con IA... 🎥\n\nEste proceso puede tardar varios minutos, por favor ten paciencia.` }, { quoted: msg });

    try {
      const apiUrl = `https://myapiadonix.casacam.net/ai/veo3?apikey=AdonixKeyvomkuv5056&prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);

      if (!response.data.status || !response.data.video) {
        throw new Error('La API no devolvió un video válido.');
      }

      const videoUrl = response.data.video;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: videoUrl },
          caption: `✨ ¡Aquí tienes tu video generado por IA!\n\nPrompt: ${prompt}`
        },
        { quoted: msg }
      );

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ ¡Video enviado!`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando videoia:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al generar el video: ${error.message}`, edit: waitingMsg.key, quoted: msg });
    }
  }
};

export default videoiaCommand;
