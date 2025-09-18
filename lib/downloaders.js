import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// --- Método 1: yt-dlp (El más robusto) ---
export async function downloadWithYtdlp(url, isVideo = false) {
  const tempDir = './temp';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const format = isVideo ? 'mp4' : 'mp3';
  const tempPath = path.join(tempDir, `${Date.now()}.${format}`);

  const ytdlpFormat = isVideo
    ? `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4`
    : `-f bestaudio --extract-audio --audio-format mp3 --audio-quality 0`;

  const command = `yt-dlp -o "${tempPath}" ${ytdlpFormat} "${url}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (stderr.includes('not found') || stderr.includes('no se reconoce')) {
            return reject(new Error('yt-dlp no está instalado o no se encuentra en el PATH.'));
        }
        return reject(error);
      }
      if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
        return reject(new Error('El archivo descargado por yt-dlp está vacío o no existe.'));
      }
      // Devolvemos la ruta al archivo, no el buffer, para manejarlo fuera.
      resolve(tempPath);
    });
  });
}

// --- Método 2: ddownr (API de oceansaver.in) ---
export async function downloadWithDdownr(url, isVideo = false) {
    const format = isVideo ? '720' : 'mp3';
    const downloadConfig = {
        method: "GET",
        url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}`,
    };
    const downloadResponse = await axios.request(downloadConfig);

    if (!downloadResponse.data?.success || !downloadResponse.data.id) {
        throw new Error("ddownr API: No se pudo iniciar la conversión.");
    }

    const progressConfig = {
        method: "GET",
        url: `https://p.oceansaver.in/ajax/progress.php?id=${downloadResponse.data.id}`,
    };

    for (let i = 0; i < 20; i++) { // Intentar por un máximo de 100 segundos
        const progressResponse = await axios.request(progressConfig);
        if (progressResponse.data?.success && progressResponse.data.progress === 1000) {
            // Devolvemos la URL para descargar el buffer fuera de esta función.
            return progressResponse.data.download_url;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error("ddownr API: El tiempo de conversión ha expirado.");
}

// --- Método 3: TheAdonix API (del código de artista) ---
export async function downloadWithAdonix(url) {
    const apiUrl = `https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    const result = response.data;
    if (!result.status || !result.data?.download) {
        throw new Error("Adonix API: No se pudo obtener el enlace de descarga.");
    }
    return result.data.download;
}

// --- Función de Ayuda Centralizada ---

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/;
const TIKTOK_REGEX = /https?:\/\/(www\.)?(vm\.tiktok\.com|tiktok\.com)\/[^\s]+/;
const FACEBOOK_REGEX = /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;

/**
 * Gestiona la descarga de una URL, identifica la plataforma y envía el medio.
 * @param {string} url La URL a descargar.
 * @param {object} sock El socket de Baileys.
 * @param {object} msg El objeto de mensaje para citar.
 * @returns {Promise<boolean>} True si tuvo éxito, false si no.
 */
export async function handleUrlDownload(url, sock, msg) {
  let isVideo = false;
  let platform = '';

  if (YOUTUBE_REGEX.test(url)) {
    platform = 'YouTube';
    isVideo = false; // Descargar como audio por defecto
  } else if (TIKTOK_REGEX.test(url)) {
    platform = 'TikTok';
    isVideo = true;
  } else if (FACEBOOK_REGEX.test(url)) {
    platform = 'Facebook';
    isVideo = true;
  } else {
    return false; // No es una URL soportada
  }

  const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `📥 Detectado enlace de ${platform}. Descargando...` }, { quoted: msg });

  let mediaBuffer;
  let tempPath;
  let source;

  try {
    // Intento 1: yt-dlp
    try {
      tempPath = await downloadWithYtdlp(url, isVideo);
      mediaBuffer = fs.readFileSync(tempPath);
      source = 'yt-dlp';
    } catch (e1) {
      console.error(`Fallo yt-dlp (${platform}):`, e1.message);
      await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ yt-dlp falló. Intentando método alternativo...`, edit: waitingMsg.key });

      // Intento 2: ddownr
      try {
        const ddownrUrl = await downloadWithDdownr(url, isVideo);
        mediaBuffer = (await axios.get(ddownrUrl, { responseType: 'arraybuffer' })).data;
        source = 'ddownr';
      } catch (e2) {
        throw new Error(`Todos los métodos de descarga para ${platform} han fallado.`);
      }
    }

    if (!mediaBuffer || mediaBuffer.length === 0) {
      throw new Error("El buffer de medios está vacío.");
    }

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Descarga completada con \`${source}\`. Enviando...`, edit: waitingMsg.key });

    if (isVideo) {
      await sock.sendMessage(msg.key.remoteJid, { video: mediaBuffer, mimetype: 'video/mp4', caption: `¡Aquí tienes tu video de ${platform}!` }, { quoted: msg });
    } else {
      await sock.sendMessage(msg.key.remoteJid, { audio: mediaBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });
    }
    return true;

  } catch (error) {
    console.error(`Error final en handleUrlDownload (${platform}):`, error);
    await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error al descargar desde ${platform}: ${error.message}`, edit: waitingMsg.key });
    return false;
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}
