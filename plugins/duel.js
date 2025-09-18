import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const duelCommand = {
  name: "duel",
  category: "rpg",
  description: "Reta a otro usuario a un duelo a muerte (simulado).",
  aliases: ["pelear", "pvp"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const challenger = usersDb[senderId];

    if (!challenger || !challenger.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (args.length === 0 || !args[0].startsWith('@')) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Debes mencionar a un usuario para retarlo a un duelo." }, { quoted: msg });
    }

    const targetId = `${args[0].replace('@', '')}@s.whatsapp.net`;
    const opponent = usersDb[targetId];

    if (!opponent || !opponent.level) {
        return sock.sendMessage(msg.key.remoteJid, { text: "El usuario que retaste no está registrado en el RPG." }, { quoted: msg });
    }

    if (senderId === targetId) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No puedes retarte a ti mismo." }, { quoted: msg });
    }

    // Simulación de batalla simple
    let challengerHP = challenger.hp;
    let opponentHP = opponent.hp;
    let battleLog = `*💥 ¡Comienza el Duelo! 💥*\n*${challenger.name}* vs *${opponent.name}*\n\n`;
    let turn = 0;

    while (challengerHP > 0 && opponentHP > 0) {
        turn++;
        battleLog += `*--- Ronda ${turn} ---*\n`;
        // El más rápido ataca primero
        if (challenger.speed >= opponent.speed) {
            const dmg1 = Math.max(1, Math.floor(challenger.strength * 1.5 - opponent.defense));
            opponentHP = Math.max(0, opponentHP - dmg1);
            battleLog += `*${challenger.name}* ataca y causa *${dmg1}* de daño. (*${opponent.name}* HP: ${opponentHP})\n`;
            if (opponentHP <= 0) break;

            const dmg2 = Math.max(1, Math.floor(opponent.strength * 1.5 - challenger.defense));
            challengerHP = Math.max(0, challengerHP - dmg2);
            battleLog += `*${opponent.name}* contraataca y causa *${dmg2}* de daño. (*${challenger.name}* HP: ${challengerHP})\n`;
        } else {
            const dmg1 = Math.max(1, Math.floor(opponent.strength * 1.5 - challenger.defense));
            challengerHP = Math.max(0, challengerHP - dmg1);
            battleLog += `*${opponent.name}* ataca y causa *${dmg1}* de daño. (*${challenger.name}* HP: ${challengerHP})\n`;
            if (challengerHP <= 0) break;

            const dmg2 = Math.max(1, Math.floor(challenger.strength * 1.5 - opponent.defense));
            opponentHP = Math.max(0, opponentHP - dmg2);
            battleLog += `*${challenger.name}* contraataca y causa *${dmg2}* de daño. (*${opponent.name}* HP: ${opponentHP})\n`;
        }
        battleLog += `\n`;
    }

    let winner, loser;
    if (challengerHP > 0) {
        winner = challenger;
        loser = opponent;
    } else {
        winner = opponent;
        loser = challenger;
    }

    const xpGained = Math.floor(loser.level * 10);
    const coinsGained = Math.floor(loser.coins * 0.1);

    winner.xp += xpGained;
    winner.coins += coinsGained;
    loser.coins -= coinsGained;

    // Actualizar HP en la DB
    challenger.hp = challengerHP;
    opponent.hp = opponentHP;

    battleLog += `*🏆 ¡El Ganador es ${winner.name}! 🏆*\n\n` +
                 `${winner.name} gana *${xpGained} XP* y *${coinsGained} monedas*.\n` +
                 `${loser.name} ha sido derrotado.`;

    const levelUpMessage = checkLevelUp(winner);
    if (levelUpMessage) {
        battleLog += `\n\n${levelUpMessage}`;
    }

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: battleLog }, { quoted: msg, contextInfo: { mentionedJid: [senderId, targetId] } });
  }
};

export default duelCommand;
