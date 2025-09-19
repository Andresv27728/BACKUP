import { downloadArtistSongs } from '../lib/artistDownloader.js';

// Estado de descarga específico para el comando 'artista2'
const downloadingState = { isDownloading: false };

const artista2Command = {
  name: "artista2",
  category: "descargas",
  description: "Descarga las 50 canciones más populares de un artista y las envía una por una.",

  async execute({ sock, msg, args }) {
    await downloadArtistSongs({
      sock,
      msg,
      args,
      commandName: this.name,
      downloadingState
    });
  }
};

export default artista2Command;
