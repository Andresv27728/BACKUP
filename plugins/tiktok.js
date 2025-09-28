import fetch from 'node-fetch';

/**
 * Llama a la API de TikWM para obtener el enlace de descarga de un video de TikTok.
 * @param {string} url La URL del video de TikTok.
 * @returns {Promise<object>} La respuesta de la API.
 */
async function tiktokdl(url) {
    const api_url = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    const response = await fetch(api_url);
    if (!response.ok) {
        throw new Error(`Error de la API de TikTok: ${response.statusText}`);
    }
    return response.json();
}

const tiktokCommand = {
    name: "tiktok",
    category: "downloader",
    description: "Descarga videos de TikTok automáticamente desde un enlace.",
    aliases: ["tk", "ttdl"],
    customPrefix: /https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\//i,

    async execute({ sock, msg, args }) {
        const url = args[0]; // El handler pasa la URL completa aquí

        try {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });

            const tiktokData = await tiktokdl(url);

            if (tiktokData.code !== 0 || !tiktokData.data || !tiktokData.data.play) {
                console.error("Respuesta inesperada de la API de TikTok:", tiktokData);
                return sock.sendMessage(msg.key.remoteJid, { text: "Error: No se pudo obtener el video de la API." }, { quoted: msg });
            }

            const videoURL = tiktokData.data.play;
            const caption = "Aquí tienes tu video de TikTok ฅ^•ﻌ•^ฅ";

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: videoURL },
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: msg });

            await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("Error en el comando tiktok:", error);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al descargar el video.\n*Detalles:* ${error.message}` }, { quoted: msg });
        }
    }
};

export default tiktokCommand;