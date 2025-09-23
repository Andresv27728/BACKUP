import { exec as execCallback } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const exec = promisify(execCallback);

const updateCommand = {
  name: "update",
  category: "propietario",
  description: "Actualiza el bot a la última versión desde GitHub, forzando la actualización.",

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

    await sock.sendMessage(msg.key.remoteJid, { text: "Iniciando actualización forzada... Tu sesión está protegida." }, { quoted: msg });

    try {
      // 1. Obtener el estado remoto sin hacer cambios locales
      await exec('git fetch origin');

      // 2. Comprobar si hay cambios
      const status = await exec('git status -uno');
      if (status.stdout.includes('Your branch is up to date') || status.stdout.includes('Tu rama está actualizada')) {
        await sock.sendMessage(msg.key.remoteJid, { text: "El bot ya está en la última versión. No hay actualizaciones pendientes." }, { quoted: msg });
        return;
      }

      // 3. Si hay cambios, forzar la actualización (la sesión está protegida por .gitignore)
      const updateCmd = 'git reset --hard origin/$(git rev-parse --abbrev-ref HEAD) && git clean -df';
      await exec(updateCmd);

      // 4. Instalar dependencias
      await sock.sendMessage(msg.key.remoteJid, { text: "Instalando dependencias (si es necesario)..." }, { quoted: msg });
      await exec('npm install');

      // 5. Reiniciar
      await sock.sendMessage(msg.key.remoteJid, { text: "✅ Actualización completada. Reiniciando el bot para aplicar los cambios..." }, { quoted: msg });
      setTimeout(() => {
        process.exit(0);
      }, 2000);

    } catch (error) {
      console.error(`Error durante la actualización forzada: ${error.message}`);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ocurrió un error durante la actualización:\n\n*Detalle:*\n${error.message}` }, { quoted: msg });
    }
  }
};

export default updateCommand;
