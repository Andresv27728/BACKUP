// Este es el manejador de mensajes que usarán los sub-bots y el bot principal.
import { commands, aliases, testCache, cooldowns } from './index.js';
import config from './config.js';
import { readSettingsDb, writeSettingsDb, readUsersDb, writeUsersDb } from './lib/database.js';
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

    const settings = readSettingsDb();
    const groupPrefix = from.endsWith('@g.us') ? settings[from]?.prefix : null;

    // --- Lógica de Anti-Link Mejorada ---
    const isGroup = from.endsWith('@g.us');
    if (isGroup && settings[from]?.antilink) {
      const LINK_REGEX = /https?:\/\/[^\s/$.?#].[^\s]*/i;
      if (LINK_REGEX.test(body)) {
        const groupMetadata = await sock.groupMetadata(from);
        const senderInfo = groupMetadata.participants.find(p => p.id === senderId);
        const isAdmin = senderInfo?.admin; // 'admin' o 'superadmin'

        // Los administradores no se ven afectados por el antilink
        if (!isAdmin) {
          const WHITELISTED_DOMAINS = ['tiktok.com', 'facebook.com', 'youtube.com', 'instagram.com', 'youtu.be', 'fb.watch'];
          const foundUrl = body.match(LINK_REGEX)[0];
          const domain = new URL(foundUrl).hostname.replace('www.', '');

          if (!WHITELISTED_DOMAINS.some(d => domain.includes(d))) {
            const usersDb = readUsersDb();
            const user = usersDb[senderId];

            if (user) {
              user.warnings = (user.warnings || 0) + 1;
              const MAX_WARNINGS = 5;

              // 1. Eliminar el mensaje
              await sock.sendMessage(from, { delete: msg.key });

              if (user.warnings > MAX_WARNINGS) {
                // 2. Expulsar al usuario
                await sock.sendMessage(from, { text: `Adiós, @${senderId.split('@')[0]}. Superaste las ${MAX_WARNINGS} advertencias por enviar enlaces.`, mentions: [senderId] });
                await sock.groupParticipantsUpdate(from, [senderId], "remove");
                user.warnings = 0; // Resetear advertencias tras expulsión
              } else {
                // 3. Enviar advertencia
                const warningMessage = `⚠️ *¡Enlace Prohibido!* ⚠️\n\n` +
                                       `@${senderId.split('@')[0]}, no se permiten enlaces de dominios no autorizados.\n` +
                                       `**Advertencia ${user.warnings}/${MAX_WARNINGS}**.\n` +
                                       `Si superas las ${MAX_WARNINGS} advertencias, serás eliminado del grupo.`;
                await sock.sendMessage(from, { text: warningMessage, mentions: [senderId] });
              }
              writeUsersDb(usersDb);
            }
            return; // Detener el procesamiento para que no se trate como comando
          }
        }
      }
    }
    // --- Fin de la Lógica de Anti-Link ---

    let commandName;
    let args;

    if (groupPrefix) {
      if (!body.startsWith(groupPrefix)) return;
      body = body.slice(groupPrefix.length);
      args = body.trim().split(/ +/).slice(1);
      commandName = body.trim().split(/ +/)[0].toLowerCase();
    } else {
      // Si hay prefijo global o si no hay prefijo de grupo, procesar normal
      const globalPrefix = config.prefix; // Asumiendo que podría haber un prefijo global en config
      if (globalPrefix && !body.startsWith(globalPrefix)) return;
      if (globalPrefix) body = body.slice(globalPrefix.length);

      args = body.trim().split(/ +/).slice(1);
      commandName = body.trim().split(/ +/)[0].toLowerCase();
    }

    let command = commands.get(commandName) || commands.get(aliases.get(commandName));

    if (command) {
      const senderNumber = senderId.split('@')[0];
      const isOwner = config.ownerNumbers.includes(senderNumber);

      // Lógica de Permisos Corregida
      if (command.category === 'propietario' && !isOwner) {
        return sock.sendMessage(from, { text: "Este comando es solo para el propietario del bot." });
      }
      if (command.category === 'subbots' && !isOwner) {
        // En un futuro, aquí se podría comprobar una lista de usuarios autorizados
        return sock.sendMessage(from, { text: "No tienes permiso para gestionar sub-bots." });
      }
      // Los sub-bots no pueden usar comandos de propietario/sub-bots
      if (isSubBot && (command.category === 'propietario' || command.category === 'subbots')) {
        return sock.sendMessage(from, { text: "Un sub-bot no puede usar este comando." });
      }

      // Cooldown
      if (cooldowns.has(senderId)) {
        const timeDiff = (Date.now() - cooldowns.get(senderId)) / 1000;
        if (timeDiff < COOLDOWN_SECONDS) return;
      }

      // Verificación de Mantenimiento
      const maintenanceList = readMaintenanceDb();
      if (maintenanceList.includes(commandName) && !isOwner) {
        return sock.sendMessage(from, { text: "🛠️ Este comando está actualmente en mantenimiento. Por favor, inténtalo más tarde." });
      }

      // Ejecución
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
