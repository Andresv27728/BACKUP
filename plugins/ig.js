import fetch from "node-fetch";

const instagramCommand = {
  name: "instagram",
  category: "descargas",
  description: "Descarga un video o reel de Instagram desde un enlace.",
  aliases: ["ig", "igdl", "insta"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de Instagram para descargar." }, { quoted: msg });
    }

    // Basic URL validation
    if (!url.includes("instagram.com/")) {
      return sock.sendMessage(msg.key.remoteJid, { text: "El enlace proporcionado no parece ser de Instagram. Por favor, verifica la URL." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "📹", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: "Procesando tu enlace de Instagram, por favor espera..." }, { quoted: msg });

      const apiUrl = `https://itzpire.com/download/instagram?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== "success" || !data.data || !data.data.media || data.data.media.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener el contenido. El enlace puede ser inválido, privado, o no contener un video." }, { quoted: msg });
      }

      const media = data.data.media[0];
      const postInfo = data.data.postInfo;

      if (!media || !media.downloadUrl) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró un enlace de descarga en la respuesta de la API." }, { quoted: msg });
      }

      const caption = `*Descarga de Instagram*\n\n` +
                      `*Autor:* ${postInfo.author || 'Desconocido'}\n` +
                      `*Publicado:* ${postInfo.timePosted || 'No disponible'}\n` +
                      `*Likes:* ${postInfo.likesCount || '0'}\n` +
                      `*Descripción:* ${postInfo.caption?.slice(0, 80) || 'Sin descripción'}...`;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: media.downloadUrl },
          caption: caption
        },
        { quoted: msg }
      );

      await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

    } catch (error) {
      console.error("Error en el comando instagram:", error);
      await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al procesar tu solicitud.\n\n*Detalles:* ${error.message}` }, { quoted: msg });
    }
  }
};

export default instagramCommand;