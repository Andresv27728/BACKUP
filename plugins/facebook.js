import axios from "axios";

// Helper to send reactions
async function doReact(emoji, msg, sock) {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key },
    });
  } catch (e) {
    console.error("Reaction error:", e);
  }
}

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb", "fbdl"],

  async execute({ sock, msg, args }) {
    await doReact("📥", msg, sock);
    const url = args[0];

    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace de Facebook para descargar." }, { quoted: msg });
    }

    const fbRegex = /^(https?:\/\/)?(www\.|m\.)?(facebook\.com|fb\.watch)\/.+/i;
    if (!fbRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "El enlace proporcionado no parece ser de Facebook. Por favor, verifica la URL." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { text: "Procesando tu enlace, por favor espera un momento..." }, { quoted: msg });

      const apiUrl = `https://suhas-bro-api.vercel.app/download/fbdown?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.result) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener la información del video. El enlace podría ser inválido o privado." }, { quoted: msg });
      }

      const { thumb, title, desc, sd, hd } = data.result;
      const videoUrl = hd || sd;

      if (!videoUrl) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontró un enlace de descarga en la respuesta de la API." }, { quoted: msg });
      }

      const infoMessage = `*Descarga de Facebook*\n\n*Título:* ${title || "Sin título"}\n\n*Descripción:* ${desc || "Sin descripción"}`.trim();

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          image: { url: thumb },
          caption: infoMessage
        },
        { quoted: msg }
      );

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption: "Aquí tienes tu video."
        },
        { quoted: msg }
      );

      await doReact("✅", msg, sock);

    } catch (error) {
      console.error("Error en el comando facebook:", error);
      await doReact("❌", msg, sock);
      await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al procesar tu solicitud. Intenta nuevamente.\n\n*Detalles:* ${error.message}` }, { quoted: msg });
    }
  }
};

export default facebookCommand;