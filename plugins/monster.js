import { readUsersDb, writeUsersDb, checkLevelUp } from '../lib/database.js';

const monsters = [
    { name: "Slime", hp: 30, strength: 5, defense: 2, xp: 10, coins: 5 },
    { name: "Goblin", hp: 50, strength: 8, defense: 4, xp: 20, coins: 15 },
    { name: "Orc", hp: 80, strength: 12, defense: 6, xp: 40, coins: 30 },
    { name: "Golem", hp: 120, strength: 10, defense: 15, xp: 70, coins: 50 }
];

const monsterCommand = {
  name: "monster",
  category: "rpg",
  description: "Lucha contra un monstruo aleatorio para ganar experiencia y botín.",
  aliases: ["luchar", "fight"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user || !user.level) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado en el RPG. Usa `reg`." }, { quoted: msg });
    }

    if (user.hp <= 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Estás derrotado. Cúrate antes de volver a luchar." }, { quoted: msg });
    }

    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    let userHP = user.hp;
    let monsterHP = monster.hp;
    let battleLog = `*👹 ¡Un ${monster.name} salvaje apareció! 👹*\n\n`;

    // Batalla simple por turnos
    while (userHP > 0 && monsterHP > 0) {
        // Usuario ataca
        const userDamage = Math.max(1, user.strength - monster.defense);
        monsterHP = Math.max(0, monsterHP - userDamage);
        battleLog += `Atacas al ${monster.name} y le haces *${userDamage}* de daño. (HP Monstruo: ${monsterHP})\n`;
        if (monsterHP <= 0) break;

        // Monstruo ataca
        const monsterDamage = Math.max(1, monster.strength - user.defense);
        userHP = Math.max(0, userHP - monsterDamage);
        battleLog += `El ${monster.name} te ataca y te hace *${monsterDamage}* de daño. (HP Usuario: ${userHP})\n\n`;
    }

    if (userHP > 0) {
        user.xp += monster.xp;
        user.coins += monster.coins;
        battleLog += `*¡Victoria!* Derrotaste al ${monster.name}.\n` +
                     `Ganaste *${monster.xp} XP* y *${monster.coins} monedas*.`;
    } else {
        battleLog += `*¡Derrota!* El ${monster.name} te ha vencido.`;
    }

    user.hp = userHP; // Actualizar HP del usuario

    const levelUpMessage = checkLevelUp(user);
    if (levelUpMessage) {
        battleLog += `\n\n${levelUpMessage}`;
    }

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: battleLog }, { quoted: msg });
  }
};

export default monsterCommand;
