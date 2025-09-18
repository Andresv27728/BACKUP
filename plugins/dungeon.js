import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const dungeonCommand = {
  name: "dungeon",
  category: "rpg",
  description: "Entra en una peligrosa mazmorra con la esperanza de encontrar grandes recompensas.",
  aliases: ["mazmorra"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 horas
    const MIN_LEVEL = 5;

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (user.level < MIN_LEVEL) {
      return sock.sendMessage(msg.key.remoteJid, { text: `Necesitas ser al menos nivel ${MIN_LEVEL} para entrar en una mazmorra.` }, { quoted: msg });
    }

    if (user.hp < user.maxHp * 0.5) {
        return sock.sendMessage(msg.key.remoteJid, { text: `Estás muy herido para entrar en una mazmorra. Cúrate primero.` }, { quoted: msg });
    }

    const lastDungeon = user.lastDungeon || 0;
    const now = Date.now();

    if (now - lastDungeon < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastDungeon);
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Las mazmorras aún se están re-poblando. Vuelve en ${hoursLeft}h y ${minutesLeft}m.` }, { quoted: msg });
    }

    user.lastDungeon = now;

    const successChance = 0.6 + (user.level - MIN_LEVEL) * 0.02; // Aumenta la probabilidad con el nivel
    let message;

    if (Math.random() < successChance) {
      // Éxito
      const xpGained = Math.floor(Math.random() * 250) + 150; // 150-400 XP
      const coinsGained = Math.floor(Math.random() * 500) + 300; // 300-800 coins
      const hpLost = Math.floor(Math.random() * 30) + 20; // 20-50 HP

      user.xp += xpGained;
      user.coins += coinsGained;
      user.hp = Math.max(0, user.hp - hpLost);

      message = `¡Conseguiste atravesar la mazmorra y derrotar al jefe!\n\n` +
                `Ganaste *${xpGained} XP* y *${coinsGained} monedas*.\n` +
                `Perdiste *${hpLost} HP* en el proceso.`;
    } else {
      // Fracaso
      const hpLost = Math.floor(user.hp * 0.75); // Pierde el 75% de su vida actual
      user.hp -= hpLost;

      message = `Los monstruos de la mazmorra te abrumaron. Apenas lograste escapar con vida.\n\n` +
                `Perdiste *${hpLost} HP*. No obtuviste recompensas.`;
    }

    if (user.hp === 0) {
        message += `\n\n*¡Has sido derrotado!* Necesitas curarte para seguir luchando.`;
    }

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `🐉 *Explorando Mazmorra...*\n\n${message}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default dungeonCommand;
