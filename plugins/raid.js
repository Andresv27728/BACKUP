import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

// Este es un comando complejo y requeriría un estado global para manejar las raids activas.
// Por ahora, será una simulación simple que asume que la raid se completa instantáneamente.

const raidBosses = {
    'dragon': { name: "Dragón Anciano", level: 20, reward: { xp: 1000, coins: 5000 } }
};

const raidCommand = {
  name: "raid",
  category: "rpg",
  description: "Únete a una incursión para derrotar a un jefe poderoso con otros jugadores.",
  aliases: ["incursion"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    const bossName = args[0] || 'dragon';
    const boss = raidBosses[bossName];

    if (!boss) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Ese jefe de incursión no existe." }, { quoted: msg });
    }

    if (user.level < boss.level) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas ser al menos nivel ${boss.level} para participar en esta incursión.` }, { quoted: msg });
    }

    // Simulación simple de éxito
    user.xp += boss.reward.xp;
    user.coins += boss.reward.coins;

    let message = `¡Te uniste a un grupo de valientes y derrotaste al ${boss.name}!\n\n` +
                  `Como recompensa, recibiste *${boss.reward.xp} XP* y *${boss.reward.coins} monedas*.`;

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    if (levelUpMessage) {
        message += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
  }
};

export default raidCommand;
