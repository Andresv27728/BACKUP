import axios from 'axios';
import config from '../config.js';
import { facebookDl, instagramDl } from './scraper.js';

export async function handleAutoDownload(sock, msg, body) {
  const from = msg.key.remoteJid;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = body.match(urlRegex);

  if (!urls || urls.length === 0) {
    return;
  }

  const url = urls[0];
  let downloadUrl;
  let downloaderName = '';

  try {
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:shorts\/)?([\w-]{11})/;
    const fbRegex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;
    const igRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[^\s]+/i;
    const tkRegex = /https?:\/\/(www\.|vm\.)?tiktok\.com\//i;

    if (ytRegex.test(url)) {
      downloaderName = 'YouTube';
      const apiResponse = await axios.get(`https://myapiadonix.casacam.net/download/yt?apikey=${config.api.adonix}&url=${encodeURIComponent(url)}&format=video`);
      if (apiResponse.data?.status === 'true' && apiResponse.data?.data?.url) {
        downloadUrl = apiResponse.data.data.url;
      } else {
        throw new Error("La API de YouTube no devolvió un enlace válido.");
      }
    } else if (fbRegex.test(url)) {
      downloaderName = 'Facebook';
      const fbLinks = await facebookDl(url);
      downloadUrl = fbLinks?.['HD'] || fbLinks?.['SD'];
      if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga de Facebook.");
    } else if (igRegex.test(url)) {
      downloaderName = 'Instagram';
      downloadUrl = await instagramDl(url);
      if (!downloadUrl) throw new Error("No se pudo obtener el enlace de descarga de Instagram.");
    } else if (tkRegex.test(url)) {
      downloaderName = 'TikTok';
      // Se usa el endpoint de search, que también funciona para URLs directas
      const apiResponse = await axios.get(`https://myapiadonix.casacam.net/search/tiktok?apikey=${config.api.adonix}&q=${encodeURIComponent(url)}`);
      if (apiResponse.data?.status === true && apiResponse.data?.result[0]?.play) {
        downloadUrl = apiResponse.data.result[0].play;
      } else {
        throw new Error("La API de TikTok no devolvió un enlace válido.");
      }
    }

    if (downloadUrl) {
      await sock.sendMessage(from, { text: `📥 Descargando video de ${downloaderName}...` }, { quoted: msg });
      await sock.sendMessage(from, { video: { url: downloadUrl }, mimetype: 'video/mp4' }, { quoted: msg });
    }
  } catch (e) {
    console.error(`Error en Auto-Descarga (${downloaderName || 'URL'}):`, e.message);
    // No se envía mensaje de error para no ser intrusivo.
  }
}
