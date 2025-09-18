import axios from 'axios';
import { downloadWithYtdlp, downloadWithDdownr } from '../lib/downloaders.js'; // Usar nuestros descargadores robustos
import fs from 'fs';

let isDownloadingArtist = false;

const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga hasta 50 canciones de un artista y las envía en lotes.",

  async execute({ sock, msg, args }) {
    if (isDownloadingArtist) {
      return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ ¡Ya hay una descarga de artista en curso! Por favor, espera a que termine." }, { quoted: msg });
    }

    const artistName = args.join(' ');
    if (!artistName) {
      return sock.sendMessage(msg.key.remoteJid, { text: "💡 Debes proporcionar el nombre de un artista." }, { quoted: msg });
    }

    isDownloadingArtist = true;
    let waitingMsg;

    try {
      waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔔 Buscando las mejores canciones de *${artistName}*...` }, { quoted: msg });

      const searchUrl = `https://delirius-apiofc.vercel.app/search/searchtrack?q=${encodeURIComponent(artistName)}`;
      const searchResponse = await axios.get(searchUrl);
      const tracks = searchResponse.data;

      if (!Array.isArray(tracks) || tracks.length === 0) {
        throw new Error("No se encontraron resultados para ese artista.");
      }

      const tracksToDownload = tracks.slice(0, 50);
      const totalTracks = tracksToDownload.length;
      const totalBatches = Math.ceil(totalTracks / 10);

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontradas ${totalTracks} canciones. Se enviarán en ${totalBatches} lotes.` }, { edit: waitingMsg.key });

      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const start = batchNum * 10;
        const end = start + 10;
        const currentBatch = tracksToDownload.slice(start, end);

        await sock.sendMessage(msg.key.remoteJid, { text: `📦 Enviando lote ${batchNum + 1} de ${totalBatches}...` }, { quoted: msg });

        for (let i = 0; i < currentBatch.length; i++) {
          const track = currentBatch[i];
          const trackTitle = track.title || "Título Desconocido";
          const trackUrl = track.url;
          let tempPath;

          try {
            await sock.sendMessage(msg.key.remoteJid, { text: `⏳ Descargando (${i + 1}/10): *${trackTitle}*` }, { quoted: msg });
            tempPath = await downloadWithYtdlp(trackUrl, false); // false for audio
            const audioBuffer = fs.readFileSync(tempPath);

            await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg', fileName: `${trackTitle}.mp3` }, { quoted: msg });

          } catch (downloadError) {
            console.error(`Falló la descarga de "${trackTitle}":`, downloadError.message);
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ Falló la descarga de *${trackTitle}*. Saltando a la siguiente.` }, { quoted: msg });
          } finally {
            // Limpiar el archivo temporal después de cada descarga
            if (tempPath && fs.existsSync(tempPath)) {
              fs.unlinkSync(tempPath);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos entre canciones
        }
      }

      await sock.sendMessage(msg.key.remoteJid, { text: "✅ *Proceso finalizado.* Se han enviado todos los lotes." }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando artista:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ *Error:* ${error.message}` }, { quoted: msg });
    } finally {
      isDownloadingArtist = false;
    }
  }
};

export default artistaCommand;
