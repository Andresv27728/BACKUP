import { tiktokStalk } from '../lib/scraper.js';

const tiktokStalkCommand = {
  name: "tiktokstalk",
  category: "informacion",
  description: "Busca información de un perfil de TikTok.",

  async execute({ sock, msg, args }) {
    const username = args[0];
    if (!username) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un nombre de usuario de TikTok." }, { quoted: msg });
    }

    try {
      const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Buscando perfil de @${username}...` }, { quoted: msg });
      const data = await tiktokStalk(username);

      if (!data) {
        throw new Error("No se pudo encontrar el perfil.");
      }

      const caption = `
*Información de TikTok*

*Nombre:* ${data.name}
*Username:* ${data.username}
*Seguidores:* ${data.followers}
*Siguiendo:* ${data.following}

*Descripción:*
${data.description}
      `;

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          image: { url: data.pp_user },
          caption: caption
        },
        { quoted: msg }
      );
      await sock.sendMessage(msg.key.remoteJid, { text: "✅ Perfil encontrado." }, { edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando tiktokstalk:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error al buscar el perfil. ${error.message}` }, { quoted: msg });
    }
  }
};

export default tiktokStalkCommand;
