import fetch from 'node-fetch';
import baileys from '@whiskeysockets/baileys';

/**
 * Envía múltiples imágenes como un mensaje de álbum en WhatsApp.
 * @param {import('@whiskeysockets/baileys').WASocket} sock El socket de Baileys.
 * @param {string} jid El JID del chat.
 * @param {Array<object>} medias Array de objetos de medios (imágenes).
 * @param {object} options Opciones adicionales como el caption.
 */
async function sendAlbumMessage(sock, jid, medias, options = {}) {
    if (typeof jid !== "string") throw new TypeError(`jid must be a string, received: ${jid}`);
    if (medias.length < 2) throw new RangeError("Se necesitan al menos 2 imágenes para un álbum");

    const caption = options.caption || "";
    const delay = !isNaN(options.delay) ? options.delay : 500;

    // Crear el contenedor del álbum
    const album = baileys.generateWAMessageFromContent(
        jid,
        { messageContextInfo: {}, albumMessage: { expectedImageCount: medias.length } },
        {}
    );

    // Enviar el contenedor vacío para iniciar el álbum
    await sock.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });

    // Enviar cada imagen asociada al álbum
    for (let i = 0; i < medias.length; i++) {
        const { type, data } = medias[i];
        const img = await baileys.generateWAMessage(
            album.key.remoteJid,
            { [type]: data, ...(i === 0 ? { caption } : {}) }, // El caption va solo en la primera imagen
            { upload: sock.waUploadToServer }
        );
        img.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key },
        };
        await sock.relayMessage(img.key.remoteJid, img.message, { messageId: img.key.id });
        await baileys.delay(delay);
    }
    return album;
}

const pinterestCommand = {
    name: 'pinterest',
    category: 'buscador',
    description: 'Busca imágenes en Pinterest y las envía como un álbum.',
    aliases: ['pin'],

    async execute({ sock, msg, args }) {
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❀ Por favor, ingresa lo que deseas buscar en Pinterest." }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: "🕒", key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { text: '✧ *Buscando y descargando imágenes de Pinterest...*' }, { quoted: msg });

        try {
            const res = await fetch(`https://api.dorratz.com/v2/pinterest?q=${encodeURIComponent(text)}`);
            const data = await res.json();

            if (!Array.isArray(data) || data.length < 2) {
                return sock.sendMessage(msg.key.remoteJid, { text: '✧ No se encontraron suficientes imágenes para crear un álbum.' }, { quoted: msg });
            }

            // Limitar a un máximo de 10 imágenes para no saturar
            const images = data.slice(0, 10).map(img => ({ type: "image", data: { url: img.image_url } }));

            const caption = `❀ *Resultados de Búsqueda Para:* ${text}`;
            await sendAlbumMessage(sock, msg.key.remoteJid, images, { caption, quoted: msg });

            await sock.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            console.error("Error en el comando pinterest:", error);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, { text: '⚠︎ Hubo un error al obtener las imágenes de Pinterest.' }, { quoted: msg });
        }
    }
};

export default pinterestCommand;