import { igdl } from 'ruhend-scraper';

const facebookCommand = {
  name: "facebook",
  category: "downloader",
  description: "Descarga un video de Facebook desde un enlace, con o sin comando.",
  aliases: ["fb", "fbdl"],
  customPrefix: /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\//i,

  async execute({ sock, msg, args }) {
    // Determinar la URL si se activa por comando o por regex
    const isCmd = this.aliases.includes(msg.command) || this.name === msg.command;
    const url = isCmd ? args[0] : msg.body;

    if (!url || !this.customPrefix.test(url)) {
      if (isCmd) { // Solo enviar mensaje de error si fue un comando explícito
        return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de Facebook válido." }, { quoted: msg });
      }
      return; // Si no es comando y no es un enlace, no hacer nada
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
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al descargar el video. Por favor, verifica que el enlace sea correcto y público.\n\n*Detalles:* ${e.message}` }, { quoted: msg });
    }
  }
};

export default facebookCommand;