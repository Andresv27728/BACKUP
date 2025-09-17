import axios from 'axios';

const transcribirCommand = {
  name: "transcribir",
  category: "herramientas",
  description: "Obtiene la transcripción de un video de YouTube.",
  aliases: ["transcript"],

  async execute({ sock, msg, args }) {
    const url = args[0];

    if (!url) {
      return sock.sendMessage(msg.key.remoteJid, { text: "★ Eh? ¿Dónde está la URL? ★\n† Necesito un enlace de YouTube para transcribir †\n\n∘ Uso: *.transcribir* <url de YouTube>" }, { quoted: msg });
    }

    if (!url.startsWith('https://')) {
      return sock.sendMessage(msg.key.remoteJid, { text: "★ Oye oye~ ★\n† Solo acepto URLs de YouTube." }, { quoted: msg });
    }

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

    try {
      const response = await axios.get('https://mayapi.ooguy.com/transcript', {
        params: {
          url: url,
          apikey: 'soymaycol<3'
        }
      });

      if (!response.data.status) {
        throw new Error('No se pudo obtener la transcripción');
      }

      const transcriptText = response.data.result.text;
      const hanakoMessage = `★ Jejeje~ Te traje la transcripción ★\n\n┌─────────────────┐\n│ † Transcripción † │\n└─────────────────┘\n\n${transcriptText}\n\n┌────────────────┐\n│ ★ MaycolPlus ★ │\n└────────────────┘`;

      await sock.sendMessage(msg.key.remoteJid, { text: hanakoMessage }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error('Error:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: `★ Oops~ Algo salió mal ★\n† ${error.message || 'Error desconocido'} †\n\n∘ Verifica que la URL sea válida\n∘ Asegúrate de que el video tenga transcripción` }, { quoted: msg });
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
    }
  }
};

export default transcribirCommand;
