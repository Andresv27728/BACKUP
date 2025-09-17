import config from '../config.js';

const waifuCommand = {
  name: "waifu",
  category: "diversion",
  description: "Muestra una imagen de waifu aleatoria.",
  aliases: ["wai"],

  async execute({ sock, msg }) {
    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: "Buscando una waifu para ti..." }, { quoted: msg });

    try {
      const apiUrl = `https://myapiadonix.casacam.net/waifu/random?apikey=${config.api.adonix}`;

      // La API devuelve la imagen directamente, por lo que se puede usar la URL en el mensaje.
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          image: { url: apiUrl },
          caption: "✨ ¡Aquí tienes tu waifu!",
          mimetype: 'image/jpeg' // Asumiendo que es jpeg, se puede cambiar si es necesario.
        },
        { quoted: msg }
      );

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ ¡Waifu encontrada!`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando waifu:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al buscar la waifu.`, edit: waitingMsg.key });
    }
  }
};

export default waifuCommand;
