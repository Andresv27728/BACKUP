import fs from 'fs';
import path from 'path';

const usersDbPath = path.resolve('./database/users.json');
const settingsDbPath = path.resolve('./database/groupSettings.json');

// --- Funciones de Directorio ---
function ensureDbDirectoryExists(dbPath) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// --- Funciones para 'users.json' ---
export function readUsersDb() {
  try {
    if (!fs.existsSync(usersDbPath)) return {};
    const data = fs.readFileSync(usersDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo la base de datos de usuarios:", error);
    return {};
  }
}

export function writeUsersDb(data) {
  try {
    ensureDbDirectoryExists(usersDbPath);
    fs.writeFileSync(usersDbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error escribiendo en la base de datos de usuarios:", error);
  }
}

// --- Funciones para 'groupSettings.json' ---
export function readSettingsDb() {
  try {
    if (!fs.existsSync(settingsDbPath)) return {};
    const data = fs.readFileSync(settingsDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo la base de datos de ajustes:", error);
    return {};
  }
}

export function writeSettingsDb(data) {
  try {
    ensureDbDirectoryExists(settingsDbPath);
    fs.writeFileSync(settingsDbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error escribiendo en la base de datos de ajustes:", error);
  }
}

// --- Funciones para 'maintenance.json' ---
const maintenanceDbPath = path.resolve('./database/maintenance.json');

export function readMaintenanceDb() {
  try {
    if (!fs.existsSync(maintenanceDbPath)) return [];
    const data = fs.readFileSync(maintenanceDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo la base de datos de mantenimiento:", error);
    return [];
  }
}

export function writeMaintenanceDb(data) {
  try {
    ensureDbDirectoryExists(maintenanceDbPath);
    fs.writeFileSync(maintenanceDbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error escribiendo en la base de datos de mantenimiento:", error);
  }
}

// --- Funciones de RPG ---

/**
 * Calcula la cantidad de XP necesaria para el siguiente nivel.
 * @param {number} level El nivel actual.
 * @returns {number} El XP necesario para el siguiente nivel.
 */
export function getXpForNextLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

/**
 * Comprueba si un usuario ha subido de nivel y actualiza sus estadísticas.
 * Devuelve un mensaje si el usuario subió de nivel.
 * @param {object} user El objeto de usuario de la base de datos.
 * @returns {string|null} Un mensaje de subida de nivel o null.
 */
export function checkLevelUp(user) {
  const xpNeeded = getXpForNextLevel(user.level);
  if (user.xp < xpNeeded) {
    return null;
  }

  // Subir de nivel
  user.level++;
  user.xp -= xpNeeded; // Restar el XP usado para subir de nivel

  // Mejorar estadísticas
  const hpGain = 10;
  const statGain = 2;
  user.maxHp += hpGain;
  user.hp = user.maxHp; // Curar al máximo al subir de nivel
  user.strength += statGain;
  user.defense += statGain;
  user.speed += statGain;

  return `🎉 *¡Subiste de Nivel!* 🎉\n\n` +
         `*Nivel:* ${user.level}\n` +
         `*HP Máximo:* +${hpGain} (${user.maxHp})\n` +
         `*Fuerza:* +${statGain} (${user.strength})\n` +
         `*Defensa:* +${statGain} (${user.defense})\n` +
         `*Velocidad:* +${statGain} (${user.speed})\n\n` +
         `¡Tu poder ha aumentado!`;
}
