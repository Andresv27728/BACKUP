import { igdl } from 'ruhend-scraper';

const facebookCommand = {
  name: "facebook",
  category: "downloader",
  description: "Descarga un video de Facebook desde un enlace, con o sin comando.",
  aliases: ["fb", "fbdl"],
  customPrefix: /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\//i,

  async execute({ sock, msg, args }) {
    // La lógica en handler.js ahora nos da el argumento correcto.
    // Si es por comando, args[0] es la URL.
    // Si es por regex, args[0] es el cuerpo completo (la URL).
    const url = args[0];

    if (!url) { // Esta comprobación es principalmente para el caso de comando sin URL
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de Facebook válido." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });

      const res = await igdl(url);
      const result = res.data;

      if (!result || result.length === 0) {
        throw new Error("No se encontraron resultados o el enlace es inválido.");
      }

      const data = result.find(i => i.resolution === "720p (HD)") || result.find(i => i.resolution === "360p (SD)");

      if (!data || !data.url) {
        throw new Error("No se encontró una resolución de video adecuada para descargar.");
      }

      const caption = "Aquí tienes tu video de Facebook.";

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: data.url },
        caption: caption,
        mimetype: 'video/mp4'
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (e) {
      console.error("Error en el comando facebook:", e);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚠️", key: msg.key } });
      // No enviar mensaje de error si se activó sin prefijo, para no ser spam
      if (msg.command) {
        await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al descargar el video.\n\n*Detalles:* ${e.message}` }, { quoted: msg });
      }
    }
  }
};

export default facebookCommand;