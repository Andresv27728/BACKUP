import yts from 'yt-search';
import axios from 'axios';
import fs from 'fs';
import { downloadWithYtdlp, downloadWithDdownr, downloadWithAdonix } from '../lib/downloaders.js';

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3) desde YouTube.",
  aliases: ["ytplay"],

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre o enlace de una canción de YouTube." }, { quoted: msg });
    }

    const query = args.join(' ');
    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔎 Buscando "${query}"...` }, { quoted: msg });

    try {
      const searchResults = await yts(query);
      if (!searchResults.videos.length) {
        throw new Error("No se encontraron resultados para tu búsqueda.");
      }

      const videoInfo = searchResults.videos[0];
      const { title, url, timestamp, author, views } = videoInfo;

      const caption = `*${title}*\n*Autor:* ${author.name}\n*Duración:* ${timestamp}\n*Vistas:* ${views.toLocaleString('es-ES')}`;
      await sock.sendMessage(msg.key.remoteJid, { text: caption, edit: waitingMsg.key });

      let audioBuffer;
      let tempPath; // Para yt-dlp
      let source;

      // --- Intento 1: yt-dlp ---
      try {
        await sock.sendMessage(msg.key.remoteJid, { text: "📥 Intentando descarga con `yt-dlp` (método 1/3)...", edit: waitingMsg.key });
        tempPath = await downloadWithYtdlp(url, false); // false para audio
        audioBuffer = fs.readFileSync(tempPath);
        source = 'yt-dlp';
      } catch (e1) {
        console.error("Fallo yt-dlp:", e1.message);
        await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ `yt-dlp` falló. Intentando con `ddownr` (método 2/3)...", edit: waitingMsg.key });

        // --- Intento 2: ddownr ---
        try {
          const ddownrUrl = await downloadWithDdownr(url, false);
          audioBuffer = (await axios.get(ddownrUrl, { responseType: 'arraybuffer' })).data;
          source = 'ddownr';
        } catch (e2) {
          console.error("Fallo ddownr:", e2.message);
          await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ `ddownr` falló. Intentando con `AdonixAPI` (método 3/3)...", edit: waitingMsg.key });

          // --- Intento 3: TheAdonix API ---
          try {
            const adonixUrl = await downloadWithAdonix(url);
            audioBuffer = (await axios.get(adonixUrl, { responseType: 'arraybuffer' })).data;
            source = 'AdonixAPI';
          } catch (e3) {
            console.error("Fallo AdonixAPI:", e3.message);
            throw new Error("Todos los métodos de descarga han fallado.");
          }
        }
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("El buffer de audio está vacío después de la descarga.");
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Descarga completada con \`${source}\`. Enviando audio...`, edit: waitingMsg.key });

      await sock.sendMessage(msg.key.remoteJid, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false // ptt: true para nota de voz
      }, { quoted: msg });

      // Opcional: Enviar como documento también
      // await sock.sendMessage(msg.key.remoteJid, { document: audioBuffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: msg });

    } catch (error) {
      console.error("Error final en el comando play:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${error.message}`, edit: waitingMsg.key });
    } finally {
        // Limpiar archivo temporal si existe
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
  }
};

export default playCommand;
