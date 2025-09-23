import yts from 'yt-search';
import axios from 'axios';
import { ytdl } from '../lib/functions.js';
import { logDownload } from '../lib/logging.js';

const play2Command = {
    name: 'play2',
    category: 'downloader',
    description: 'Busca y descarga un video de YouTube.',
    aliases: ['playvideo'],

    async execute({ sock, msg, args }) {
        const query = args.join(' ');
        if (!query) {
            return await sock.sendMessage(msg.key.remoteJid, { text: 'Por favor, proporciona el nombre de un video.' }, { quoted: msg });
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, { text: `Buscando "${query}"...` }, { quoted: msg });

            const searchResults = await yts(query);
            const video = searchResults.videos[0];

            if (!video) {
                return await sock.sendMessage(msg.key.remoteJid, { text: 'No se encontraron resultados.' }, { quoted: msg });
            }

            const caption = `*Título:* ${video.title}\n*Duración:* ${video.timestamp}\n*Autor:* ${video.author.name}`;
            const infoText = `*Título:* ${video.title}\n*URL:* ${video.url}`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: video.thumbnail },
                caption: caption + '\n\nDescargando video, por favor espera...'
            }, { quoted: msg });

            const result = await ytdl(video.url, 'mp4');
            const videoResponse = await axios.get(result.url, { responseType: 'arraybuffer' });
            const videoBuffer = videoResponse.data;

            const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
                video: Buffer.from(videoBuffer, 'binary'),
                mimetype: 'video/mp4',
                caption: caption
            }, { quoted: msg });

            await logDownload(sock, msg, sentMsg, infoText);

        } catch (error) {
            console.error('Error en el comando play2:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al descargar el video: ${error.message}` }, { quoted: msg });
        }
    }
};

export default play2Command;
