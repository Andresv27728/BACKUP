import { igdl } from "ruhend-scraper";

const instagramCommand = {
  name: "instagram",
  category: "downloader",
  description: "Descarga un video o historia de Instagram desde un enlace.",
  aliases: ["ig"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de Instagram para descargar el video o la historia." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: "Descargando contenido de Instagram..." }, { quoted: msg });

      const res = await igdl(url);
      const data = res.data;

      if (!data || data.length === 0) {
        throw new Error('No se encontraron medios en el enlace proporcionado.');
      }

      const media = data.sort((a, b) => {
        const resA = parseInt(a.resolution) || 0;
        const resB = parseInt(b.resolution) || 0;
        return resB - resA;
      })[0];

      if (!media || !media.url) {
        throw new Error('No se pudo encontrar un video o imagen con resolución adecuada.');
      }

      // Determinar si es video o imagen basado en la extensión o el tipo (si estuviera disponible)
      const isVideo = media.url.includes('.mp4') || media.type === 'video';

      if (isVideo) {
        await sock.sendMessage(msg.key.remoteJid, {
          video: { url: media.url },
          caption: 'Aquí está tu video de Instagram.'
        }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          image: { url: media.url },
          caption: 'Aquí está tu imagen de Instagram.'
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (err) {
      console.error("Error en el comando instagram:", err);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "⚠️", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al descargar desde Instagram. Por favor, verifica que el enlace sea correcto y que el perfil no sea privado.\n\n*Detalles:* ${err.message}` }, { quoted: msg });
    }
  }
};

export default instagramCommand;
