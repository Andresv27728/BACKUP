import axios from 'axios';
import config from '../config.js';

let isDownloadingArtist = false;

const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga las 10 canciones más populares de un artista.",

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

      const tracksToDownload = tracks.slice(0, 10);
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontradas ${tracksToDownload.length} canciones. Iniciando descargas en orden...` }, { edit: waitingMsg.key });

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        const trackTitle = track.title || "Título Desconocido";
        const trackUrl = track.url;

        try {
          await sock.sendMessage(msg.key.remoteJid, { text: `[${i + 1}/${tracksToDownload.length}] Descargando: *${trackTitle}*...` }, { quoted: msg });

          const apiUrl = `${config.api.adonix.baseURL}/download/yt?apikey=${config.api.adonix.apiKey}&url=${encodeURIComponent(trackUrl)}&format=audio`;

          const response = await axios.get(apiUrl);
          const result = response.data;

          if (!result.status || result.status !== 'true' || !result.data || !result.data.url) {
            throw new Error("La API no devolvió un enlace de descarga válido.");
          }

          const downloadUrl = result.data.url;
          const audioBuffer = (await axios.get(downloadUrl, { responseType: 'arraybuffer' })).data;

          await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });
          await sock.sendMessage(msg.key.remoteJid, { text: trackTitle }, { quoted: msg });

        } catch (downloadError) {
            console.error(`Falló la descarga de "${trackTitle}":`, downloadError.message);
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ Falló la descarga de *${trackTitle}*. Saltando a la siguiente.` }, { quoted: msg });
            continue;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await sock.sendMessage(msg.key.remoteJid, { text: "✅ *Descargas Finalizadas Exitosamente.*" }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando artista:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ *Error:* ${error.message}` }, { quoted: msg });
    } finally {
      isDownloadingArtist = false;
    }
  }
};

export default artistaCommand;
