import { exec } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const updateCommand = {
  name: "update",
  category: "propietario",
  description: "Actualiza el bot a la última versión desde el repositorio de GitHub.",

  async execute({ sock, msg, config }) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    if (!config.ownerNumbers.includes(senderNumber)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "Este comando solo puede ser utilizado por el propietario del bot." }, { quoted: msg });
      return;
    }

    const gitDir = join(process.cwd(), '.git');
    if (!existsSync(gitDir)) {
        await sock.sendMessage(msg.key.remoteJid, { text: "No se puede actualizar. El bot no parece estar en un repositorio de Git." }, { quoted: msg });
        return;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: "Iniciando actualización... Descargando los últimos cambios desde GitHub." }, { quoted: msg });

    exec('git pull', async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error en git pull: ${error.message}`);
        let errorMessage = `Ocurrió un error durante la actualización.\n\n*Mensaje de error:*\n${error.message}`;
        if (error.message.includes('Please commit your changes or stash them before you merge')) {
            errorMessage += '\n\n*Sugerencia:*\nParece que tienes cambios locales sin guardar. Por favor, guárdalos con `git stash` o deséchalos antes de actualizar.';
        } else if (error.message.includes('Permission denied')) {
            errorMessage += '\n\n*Sugerencia:*\nHa ocurrido un error de permisos. Asegúrate de que el bot tiene los permisos correctos para acceder al repositorio de Git.';
        }
        await sock.sendMessage(msg.key.remoteJid, { text: errorMessage }, { quoted: msg });
        return;
      }

      if (stderr && !stderr.includes('Already up to date.')) {
        // git pull a menudo usa stderr para mensajes de estado, así que lo tratamos como info
        console.log(`Git stderr: ${stderr}`);
      }

      if (stdout.includes("Already up to date.") || stdout.includes("Ya está actualizado.")) {
        await sock.sendMessage(msg.key.remoteJid, { text: "El bot ya está en la última versión. No hay actualizaciones pendientes." }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: `*Actualización completada.*\n\n\`\`\`${stdout}\`\`\`\n\nReiniciando el bot para aplicar los cambios...` }, { quoted: msg });
        // Usamos un pequeño timeout para dar tiempo a que el mensaje se envíe antes de cerrar el proceso
        setTimeout(() => {
          process.exit(0);
        }, 3000); // 3 segundos
      }
    });
  }
};

export default updateCommand;
