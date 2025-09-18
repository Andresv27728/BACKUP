import axios from 'axios';
import fs from 'fs';
import { downloadWithYtdlp, downloadWithDdownr } from '../lib/downloaders.js';

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb", "fbdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const fbRegex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;

    if (!url || !fbRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de Facebook." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🌊 Procesando tu video de Facebook...` }, { quoted: msg });

    let videoBuffer;
    let tempPath; // Para yt-dlp
    let source;

    try {
        // --- Intento 1: yt-dlp ---
        try {
            await sock.sendMessage(msg.key.remoteJid, { text: "📥 Intentando descarga con `yt-dlp` (método 1/2)...", edit: waitingMsg.key });
            tempPath = await downloadWithYtdlp(url, true); // true para video
            videoBuffer = fs.readFileSync(tempPath);
            source = 'yt-dlp';
        } catch (e1) {
            console.error("Fallo yt-dlp (Facebook):", e1.message);
            await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ `yt-dlp` falló. Intentando con `ddownr` (método 2/2)...", edit: waitingMsg.key });

            // --- Intento 2: ddownr ---
            try {
                const ddownrUrl = await downloadWithDdownr(url, true); // true para video
                videoBuffer = (await axios.get(ddownrUrl, { responseType: 'arraybuffer' })).data;
                source = 'ddownr';
            } catch (e2) {
                console.error("Fallo ddownr (Facebook):", e2.message);
                throw new Error("Todos los métodos de descarga para Facebook han fallado.");
            }
        }

        if (!videoBuffer || videoBuffer.length === 0) {
            throw new Error("El buffer de video está vacío después de la descarga.");
        }

        await sock.sendMessage(msg.key.remoteJid, { text: `✅ Descarga completada con \`${source}\`. Enviando video...`, edit: waitingMsg.key });

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                video: videoBuffer,
                caption: `¡Aquí tienes tu video de Facebook!`,
                mimetype: 'video/mp4'
            },
            { quoted: msg }
        );

    } catch (error) {
        console.error("Error final en el comando facebook:", error);
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${error.message}`, edit: waitingMsg.key });
    } finally {
        // Limpiar archivo temporal si existe
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
  }
};

export default facebookCommand;
