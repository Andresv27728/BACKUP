import { readUsersDb, getXpForNextLevel } from '../lib/database.js';

const statsCommand = {
  name: "stats",
  category: "rpg",
  description: "Muestra tus estadísticas de personaje en el RPG.",
  aliases: ["estadisticas", "profile", "perfil"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) { // Comprobar si el usuario está registrado en el sistema RPG
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el sistema RPG. Usa el comando `reg` para comenzar tu aventura." }, { quoted: msg });
    }

    const xpNeeded = getXpForNextLevel(user.level);
    const xpProgress = `${user.xp}/${xpNeeded} XP`;

    const statsMessage = `*📊 Estadísticas de ${user.name} 📊*\n\n` +
                         `*Nivel:* ${user.level}\n` +
                         `*Experiencia:* ${xpProgress}\n` +
                         `*HP:* ${user.hp}/${user.maxHp} ❤️\n` +
                         `*Monedas:* ${user.coins} 💰\n\n` +
                         `*⚔️ Atributos de Combate ⚔️*\n` +
                         `*Fuerza:* ${user.strength}\n` +
                         `*Defensa:* ${user.defense}\n` +
                         `*Velocidad:* ${user.speed}\n\n` +
                         `*🎒 Inventario 🎒*\n` +
                         `*Pociones:* ${user.inventory.potions || 0}\n` +
                         `*Madera:* ${user.inventory.wood || 0}\n` +
                         `*Piedra:* ${user.inventory.stone || 0}\n` +
                         `*Hierro:* ${user.inventory.iron || 0}\n` +
                         `*Diamantes:* ${user.inventory.diamonds || 0}`;

    await sock.sendMessage(msg.key.remoteJid, { text: statsMessage }, { quoted: msg });
  }
};

export default statsCommand;
