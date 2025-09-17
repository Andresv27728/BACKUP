import { readUsersDb } from '../lib/database.js';

const dashCommand = {
  name: "dash",
  category: "propietario",
  description: "Muestra un dashboard de actividad del grupo (solo para el propietario).",
  aliases: ["dashboard"],

  async execute({ sock, msg, args, isOwner }) {
    if (!isOwner) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Este comando es solo para el propietario del bot." }, { quoted: msg });
    }

    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: "Este comando solo se puede usar en grupos." }, { quoted: msg });
    }

    try {
      const users = readUsersDb();
      const groupMembers = Object.entries(users)
        .map(([id, data]) => ({
          id,
          name: data.name || id.split('@')[0],
          messageCount: data.groups?.[from]?.messageCount || 0
        }))
        .filter(user => user.messageCount > 0)
        .sort((a, b) => b.messageCount - a.messageCount);

      if (groupMembers.length === 0) {
        return sock.sendMessage(from, { text: "No hay actividad registrada en este grupo." }, { quoted: msg });
      }

      const page = parseInt(args[0]) || 1;
      const pageSize = 10;
      const totalPages = Math.ceil(groupMembers.length / pageSize);

      if (page < 1 || page > totalPages) {
        return sock.sendMessage(from, { text: `Número de página inválido. Por favor, elige una página entre 1 y ${totalPages}.` }, { quoted: msg });
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pageMembers = groupMembers.slice(startIndex, endIndex);

      let dashboardText = `*📊 Dashboard de Actividad del Grupo*\n\n`;
      pageMembers.forEach((user, index) => {
        const rank = startIndex + index + 1;
        dashboardText += `${rank}. *${user.name}*\n   - Mensajes: ${user.messageCount}\n`;
      });

      dashboardText += `\n*Página ${page} de ${totalPages}*`;

      await sock.sendMessage(from, { text: dashboardText }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando dash:", error);
      await sock.sendMessage(from, { text: "Ocurrió un error al generar el dashboard." }, { quoted: msg });
    }
  }
};

export default dashCommand;
