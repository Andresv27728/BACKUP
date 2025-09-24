import axios from 'axios';
import config from '../config.js'; // Asumiendo que el prefijo podría estar en config

const instagramCommand = {
  name: "instagram",
  aliases: ["ig"],
  category: "descargas",
  description: "Descarga contenido de Instagram desde un enlace.",

  async execute({ sock, msg, args }) {
    const text = args.join(" ");
    const pref = config.prefix || "."; // Usar prefijo de config o '.' por defecto

    if (!text) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `✳️ *Usa:*\n${pref}${this.name} <enlace>\nEj: *${pref}${this.name}* https://www.instagram.com/p/CCoI4DQBGVQ/`
      }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: "🦈 Hunting for content..." }, { quoted: msg });

    try {
      const apiUrl = `https://api.dorratz.com/igdl?url=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl);
      const { data } = response.data;

      if (!data || data.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "❌ *No se pudo obtener el contenido de Instagram.*"
        }, { quoted: msg, edit: waitingMsg.key });
      }

      const caption = `🎬 *Contenido IG descargado*\n𖠁 *API:* api.dorratz.com`;

      for (const item of data) {
        // Descargar el buffer directamente
        const videoRes = await axios.get(item.url, { responseType: "arraybuffer" });
        const buffer = videoRes.data;

        // Comprobar tamaño del buffer
        const sizeMB = buffer.length / (1024 * 1024);
        if (sizeMB > 300) {
          await sock.sendMessage(msg.key.remoteJid, {
            text: `❌ Un video pesa ${sizeMB.toFixed(2)}MB y excede el límite de 300MB.`
          }, { quoted: msg });
          continue; // Saltar este item y continuar con el siguiente
        }

        // Enviar el contenido (puede ser video o imagen)
        if (item.url.includes('.mp4')) {
             await sock.sendMessage(msg.key.remoteJid, {
                video: buffer,
                mimetype: "video/mp4",
                caption
            }, { quoted: msg });
        } else {
             await sock.sendMessage(msg.key.remoteJid, {
                image: buffer,
                mimetype: "image/jpeg",
                caption
            }, { quoted: msg });
        }
      }

      try {
        await sock.deleteMessage(msg.key.remoteJid, waitingMsg.key);
      } catch (deleteError) {
        console.error("Error al eliminar el mensaje de espera en ig.js:", deleteError);
      }

    } catch (err) {
      console.error("❌ Error en comando Instagram:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ *Ocurrió un error al procesar el enlace de Instagram.*"
      }, { quoted: msg, edit: waitingMsg.key });
    }
  }
};

export default instagramCommand;
