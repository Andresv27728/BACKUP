// Este es el manejador de mensajes que usarán los sub-bots y el bot principal.
import { commands, aliases, testCache, cooldowns } from './index.js';
import config from './config.js';
import { readSettingsDb, readMaintenanceDb } from './lib/database.js';
import print from './lib/print.js';

const COOLDOWN_SECONDS = 5;
const RESPONSE_DELAY_MS = 2000;

export async function handler(m, isSubBot = false) { // Se añade isSubBot para diferenciar
  const sock = this;

  try {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // Pretty print message to console
    try { await print(msg, sock); } catch {}

    const senderId = msg.key.participant || msg.key.remoteJid;
    msg.sender = senderId; // Adjuntar para fácil acceso

    const from = msg.key.remoteJid;
    let body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    msg.body = body; // Adjuntar para fácil acceso en los plugins

    let command = null;
    let commandName = '';
    let args = [];

    const settings = readSettingsDb();
    const groupPrefix = from.endsWith('@g.us') ? settings[from]?.prefix : null;
    const globalPrefix = config.prefix || '.'; // Usar '.' como prefijo global por defecto

    let isPrefixed = false;
    let textAfterPrefix = '';

    if (groupPrefix && body.startsWith(groupPrefix)) {
      isPrefixed = true;
      textAfterPrefix = body.slice(groupPrefix.length);
    } else if (!groupPrefix && body.startsWith(globalPrefix)) {
      isPrefixed = true;
      textAfterPrefix = body.slice(globalPrefix.length);
    }

    // 1. Probar comandos con prefijo
    if (isPrefixed) {
      commandName = textAfterPrefix.trim().split(/ +/)[0].toLowerCase();
      command = commands.get(commandName) || commands.get(aliases.get(commandName));
      if (command) {
        args = textAfterPrefix.trim().split(/ +/).slice(1);
      }
    }

    // 2. Si no se encontró un comando con prefijo, probar sin prefijo (regex)
    if (!command) {
      for (const cmd of commands.values()) {
        if (cmd.customPrefix && cmd.customPrefix.test(body)) {
          command = cmd;
          commandName = cmd.name;
          args = [body]; // El cuerpo completo es el argumento
          break;
        }
      }
    }

    // Asignar el nombre del comando al mensaje para uso interno en plugins
    msg.command = commandName;

    // 3. Si se encontró un comando (con o sin prefijo), ejecutarlo
    if (command) {
      const senderNumber = senderId.split('@')[0];
      const isOwner = config.ownerNumbers.includes(senderNumber);

      if (command.category === 'propietario' && !isOwner) {
        return sock.sendMessage(from, { text: "Este comando es solo para el propietario del bot." });
      }
      if (isSubBot && (command.category === 'propietario' || command.category === 'subbots')) {
        return sock.sendMessage(from, { text: "Un sub-bot no puede usar este comando." });
      }

      if (cooldowns.has(senderId)) {
        const timeDiff = (Date.now() - cooldowns.get(senderId)) / 1000;
        if (timeDiff < COOLDOWN_SECONDS) return;
      }

      const maintenanceList = readMaintenanceDb();
      if (maintenanceList.includes(commandName) && !isOwner) {
        return sock.sendMessage(from, { text: "🛠️ Este comando está actualmente en mantenimiento." });
      }

      try {
        await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY_MS));
        await command.execute({ sock, msg, args, commands, config, testCache, isOwner });
        cooldowns.set(senderId, Date.now());
      } catch (error) {
        console.error(`Error en comando ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'Ocurrió un error al ejecutar ese comando.' });
      }
    }
  } catch (e) {
    console.error("Error en el manejador de mensajes:", e);
  }
}