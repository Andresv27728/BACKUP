import axios from 'axios';

const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Realiza una petición GET con una política de reintentos para errores de servidor.
 * @param {string} url La URL a la que hacer la petición.
 * @param {object} config La configuración de Axios.
 * @returns {Promise<object>} La data de la respuesta de Axios.
 */
export async function fetchWithRetry(url, config = {}) {
  for (let i = 0; i < RETRY_COUNT; i++) {
    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      // Reintentar solo si es un error de servidor (5xx)
      if (error.response && error.response.status >= 500 && error.response.status <= 599) {
        console.log(`Intento ${i + 1} fallido con error ${error.response.status}. Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        // Si no es un error de servidor, lanzar el error inmediatamente
        throw error;
      }
    }
  }
  // Si todos los reintentos fallan, lanzar un error final
  throw new Error(`La solicitud a la API falló después de ${RETRY_COUNT} intentos.`);
}
