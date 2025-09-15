import axios from 'axios';

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3).",

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de una canción." }, { quoted: msg });
    }

    const query = args.join(' ');
    let waitingMsg;

    try {
      waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🎶 Buscando y descargando "${query}"...` }, { quoted: msg });

      const apiUrl = `https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(query)}`;

      // First, get the download link
      const apiResponse = await axios.get(apiUrl);
      const downloadUrl = apiResponse.data.data.download;

      if (!downloadUrl) {
          throw new Error("No se pudo obtener el enlace de descarga de la API.");
      }

      // Then, download the audio buffer from the link
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer'
      });

      const audioBuffer = response.data;

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("No se pudo obtener el audio de la API.");
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Descarga completada. Enviando archivos...` }, { edit: waitingMsg.key });

      // Enviar como audio reproducible
      await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });

      // Enviar como documento
      await sock.sendMessage(msg.key.remoteJid, { document: audioBuffer, mimetype: 'audio/mpeg', fileName: `${query}.mp3` }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando play:", error);
      let errorMessage = "Error al descargar la canción.";
      if (error.response) {
          console.error(error.response.data);
          console.error(error.response.status);
          console.error(error.response.headers);
          errorMessage = `Error de la API: ${error.response.status}`;
      } else if (error.request) {
          console.error(error.request);
          errorMessage = "La API no respondió.";
      } else {
          console.error('Error', error.message);
          errorMessage = error.message;
      }
      const errorMsg = { text: `❌ ${errorMessage}` };
       if (waitingMsg) {
        await sock.sendMessage(msg.key.remoteJid, { ...errorMsg, edit: waitingMsg.key });
      } else {
        await sock.sendMessage(msg.key.remoteJid, errorMsg, { quoted: msg });
      }
    }
  }
};

export default playCommand;
