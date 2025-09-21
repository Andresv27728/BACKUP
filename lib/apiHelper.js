import axios from 'axios';

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * Realiza una petición GET con una política de reintentos para errores de servidor.
 * @param {string} url La URL a la que hacer la petición.
 * @param {object} config La configuración de Axios.
 * @param {object} options Opciones de reintento.
 * @param {number} options.retries Número de reintentos.
 * @param {boolean} options.silent Si es true, no se loguearán los reintentos en la consola.
 * @returns {Promise<import('axios').AxiosResponse>} La respuesta completa de Axios.
 */
export async function fetchWithRetry(url, config = {}, { retries = DEFAULT_RETRY_COUNT, silent = false } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      if (error.response && error.response.status >= 500 && error.response.status <= 599) {
        if (!silent) {
          console.log(`Intento ${i + 1} de ${retries} fallido con error ${error.response.status}. Reintentando en ${DEFAULT_RETRY_DELAY_MS / 1000}s...`);
        }
        await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_DELAY_MS));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`La solicitud a la API falló después de ${retries} intentos.`);
}
