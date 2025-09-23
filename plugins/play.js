import fetch from 'node-fetch';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const streamPipe = promisify(pipeline);

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3).",
  aliases: ["playaudio"],

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de una canción." }, { quoted: msg });
    }

    const query = args.join(' ');
    await sock.sendMessage(msg.key.remoteJid, { text: `Buscando "${query}"...` }, { quoted: msg });

    try {
      // --- PASO 1: Buscar el video ---
      const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(query)}`;
      const searchResponse = await fetch(searchApi);
      const searchData = await searchResponse.json();

      if (!searchData?.data || searchData.data.length === 0) {
        throw new Error(`No se encontraron resultados de video para "${query}".`);
      }

      const video = searchData.data[0];
      const videoTitle = video.title;
      const videoUrl = video.url; // URL del video de YouTube

      // --- PASO 2: Descargar y convertir el audio ---
      await sock.sendMessage(msg.key.remoteJid, { text: `Descargando y convirtiendo: *${videoTitle}*` }, { quoted: msg });

      const api = `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=audio&quality=128kbps&apikey=russellxz`;
      const res = await axios.get(api);
      if (!res.data?.status || !res.data.data?.url) {
        throw new Error("No se pudo obtener la URL del stream de audio desde la API de descarga.");
      }

      const tmpDir = path.join(__dirname, '../tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const inFile = path.join(tmpDir, `${Date.now()}_in.m4a`);
      const outFile = path.join(tmpDir, `${Date.now()}_out.mp3`);

      const download = await axios.get(res.data.data.url, { responseType: "stream" });
      await streamPipe(download.data, fs.createWriteStream(inFile));

      await new Promise((resolve, reject) => {
        ffmpeg(inFile)
          .audioCodec("libmp3lame")
          .audioBitrate("128k")
          .format("mp3")
          .save(outFile)
          .on("end", resolve)
          .on("error", reject);
      });

      const audioBuffer = fs.readFileSync(outFile);

      // Limpieza de archivos temporales
      fs.unlinkSync(inFile);
      fs.unlinkSync(outFile);

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("La conversión a MP3 falló o el archivo resultante está vacío.");
      }

      // --- PASO 3: Enviar los mensajes ---
      // Enviar como audio reproducible
      await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });

      // Enviar como documento
      await sock.sendMessage(msg.key.remoteJid, { document: audioBuffer, mimetype: 'audio/mpeg', fileName: `${videoTitle}.mp3` }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando play:", error);
      const errorMessage = `❌ No se pudo descargar la canción. Detalle: ${error.message}`;
      await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
    }
  }
};

export default playCommand;
