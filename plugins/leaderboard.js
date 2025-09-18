import { readUsersDb } from '../lib/database.js';

const leaderboardCommand = {
  name: "leaderboard",
  category: "rpg",
  description: "Muestra la tabla de clasificación. Uso: `leaderboard [coins|level|strength|defense]`",
  aliases: ["lb", "top"],

  async execute({ sock, msg, args }) {
    const usersDb = readUsersDb();
    let users = Object.values(usersDb);

    if (users.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No hay usuarios registrados para mostrar." }, { quoted: msg });
    }

    const sortBy = args[0]?.toLowerCase() || 'level'; // Por defecto ordena por nivel
    let sortKey;
    let title;
    let unit;

    switch (sortBy) {
      case 'coins':
        sortKey = 'coins';
        title = '💰 Más Ricos';
        unit = 'monedas';
        break;
      case 'strength':
        sortKey = 'strength';
        title = '💪 Más Fuertes';
        unit = 'fuerza';
        break;
      case 'defense':
        sortKey = 'defense';
        title = '🛡️ Mejor Defensa';
        unit = 'defensa';
        break;
      case 'level':
      default:
        sortKey = 'level';
        title = '🏆 Mayor Nivel';
        unit = 'nivel';
        break;
    }

    // Filtrar usuarios que tienen el atributo y ordenar
    users = users.filter(u => u[sortKey] !== undefined).sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));

    const topUsers = users.slice(0, 10);

    if (topUsers.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Nadie tiene estadísticas de ${unit} aún.` }, { quoted: msg });
    }

    let leaderboardMessage = `*🏅 Tabla de Clasificación - ${title} 🏅*\n\n`;
    topUsers.forEach((user, index) => {
      leaderboardMessage += `${index + 1}. *${user.name}* - ${user[sortKey] || 0} ${unit}\n`;
    });

    leaderboardMessage += "\n_Usa `leaderboard [coins|level|strength|defense]` para ver otros rankings._";

    await sock.sendMessage(msg.key.remoteJid, { text: leaderboardMessage }, { quoted: msg });
  }
};

export default leaderboardCommand;
