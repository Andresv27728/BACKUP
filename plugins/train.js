import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const trainCommand = {
  name: "train",
  category: "rpg",
  description: "Entrena tus atributos para volverte más fuerte.",
  aliases: ["entrenar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora
    const COST = 200; // Costo en monedas para entrenar

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (user.coins < COST) {
        return sock.sendMessage(msg.key.remoteJid, { text: `No tienes suficientes monedas para entrenar. Necesitas ${COST} monedas.` }, { quoted: msg });
    }

    const lastTrain = user.lastTrain || 0;
    const now = Date.now();

    if (now - lastTrain < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastTrain);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Aún estás cansado de tu último entrenamiento. Vuelve en ${minutesLeft}m.` }, { quoted: msg });
    }

    user.lastTrain = now;
    user.coins -= COST;

    // Aumentar un stat aleatorio
    const statRoll = Math.floor(Math.random() * 3);
    let statImproved = "";
    let improvement = 1;

    if (statRoll === 0) {
        user.strength += improvement;
        statImproved = "Fuerza";
    } else if (statRoll === 1) {
        user.defense += improvement;
        statImproved = "Defensa";
    } else {
        user.speed += improvement;
        statImproved = "Velocidad";
    }

    const xpGained = 50;
    user.xp += xpGained;

    let message = `Pagaste *${COST} monedas* y entrenaste duro.\n\n` +
                  `Tu *${statImproved}* ha aumentado en *${improvement}*.\n` +
                  `Ganaste *${xpGained} XP*.`;

    const levelUpMessage = checkLevelUp(user);
    writeUsersDb(usersDb);

    let fullMessage = `💪 *Sesión de Entrenamiento...*\n\n${message}`;
    if (levelUpMessage) {
      fullMessage += `\n\n${levelUpMessage}`;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: fullMessage }, { quoted: msg });
  }
};

export default trainCommand;
