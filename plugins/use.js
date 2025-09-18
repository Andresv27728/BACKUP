import { readUsersDb, writeUsersDb } from '../lib/database.js';
import { shopItems } from '../lib/shop-items.js';

const useCommand = {
  name: "use",
  category: "rpg",
  description: "Usa un objeto de tu inventario. Uso: `use <id_del_objeto>`",
  aliases: ["usar"],

  async execute({ sock, msg, args }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];
    const itemId = args[0]?.toLowerCase();

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa `reg`." }, { quoted: msg });
    }

    if (!itemId) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, especifica el ID del objeto que quieres usar. Revisa tu `inventory`." }, { quoted: msg });
    }

    if (!user.inventory || !user.inventory[itemId] || user.inventory[itemId] <= 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: `No tienes "${itemId}" en tu inventario.` }, { quoted: msg });
    }

    const item = shopItems.find(i => i.id === itemId);
    if (!item) {
        return sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error, el objeto no se encuentra en la lista de objetos." }, { quoted: msg });
    }

    let message = "";
    let consumeItem = true; // La mayoría de los objetos se consumen

    // Lógica de efectos de los objetos
    switch (itemId) {
      case 'pocion_vida':
        if (user.hp >= user.maxHp) {
          return sock.sendMessage(msg.key.remoteJid, { text: "Ya tienes la salud al máximo." }, { quoted: msg });
        }
        const healAmount = Math.floor(user.maxHp * 0.5); // Cura 50%
        user.hp = Math.min(user.maxHp, user.hp + healAmount);
        message = `Usaste una *Poción de Vida Menor* y recuperaste *${healAmount} HP*. Salud actual: ${user.hp}/${user.maxHp} ❤️`;
        break;

      case 'trebol':
      case 'suerte': // Aceptar el ID antiguo también
        const luckDuration = 1 * 60 * 60 * 1000; // 1 hora
        user.effects.suerte = Date.now() + luckDuration;
        message = `🍀 Usaste un *Trébol de 4 Hojas*. ¡Tu suerte ha aumentado por 1 hora!`;
        break;

      case 'elixir':
        const xpBoostDuration = 30 * 60 * 1000; // 30 minutos
        user.effects.xp_boost = Date.now() + xpBoostDuration;
        message = `🧠 Usaste un *Elixir de Sabiduría*. ¡Ganas el doble de experiencia por 30 minutos!`;
        break;

      case 'galleta':
        const fortunes = ["Un gran viaje te espera.", "Cuidado con los goblins con sombrero.", "Pronto recibirás una ganancia inesperada.", "El número 7 será tu aliado hoy."];
        message = `Abres la galleta de la fortuna y lees: "${fortunes[Math.floor(Math.random() * fortunes.length)]}"`;
        break;

      case 'roca':
        message = `Miras fijamente a tu *Roca Mascota*. Ella te devuelve la mirada. Ha sido un momento profundo.`;
        consumeItem = false; // No se consume la roca mascota
        break;

      case 'cofre':
        const min = item.price * 0.5;
        const max = item.price * 2.0;
        const amount = Math.floor(Math.random() * (max - min + 1)) + min;
        user.coins += amount;
        message = `¡Abriste el cofre y encontraste *${amount.toLocaleString()} monedas*!`;
        break;

      default:
        return sock.sendMessage(msg.key.remoteJid, { text: `El objeto "${item.name}" no es consumible o su efecto aún no ha sido implementado.` }, { quoted: msg });
    }

    if (consumeItem) {
        user.inventory[itemId]--;
        if (user.inventory[itemId] <= 0) {
            delete user.inventory[itemId];
        }
    }

    writeUsersDb(usersDb);
    await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
  }
};

export default useCommand;
