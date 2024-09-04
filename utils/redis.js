// utils/redis.js
// Importation de la fonction promisify pour
// convertir des méthodes de rappel en promesses
// said
import { promisify } from 'util';
// Importation de la fonction createClient depuis le module redis
import { createClient } from 'redis';

// Classe pour définir des méthodes pour
// les commandes Redis couramment utilisées
class RedisClient {
  constructor() {
    // Création d'un client Redis
    this.client = createClient();

    // Gestion des erreurs de connexion
    this.client.on('error', (error) => {
      console.log(
        `Redis client not connected to server: ${error}
        `,
      ); // Affichage d'un message en cas d'erreur de connexion
    });
  }

  // Méthode pour vérifier l'état de la connexion et rapporter
  isAlive() {
    // Vérifie si le client Redis est connecté
    if (this.client.connected) {
      return true; // Retourne true si la connexion est active
    }
    return false; // Retourne false sinon
  }

  // Méthode pour obtenir la valeur d'une clé depuis le serveur Redis
  async get(ky) {
    // Convertit la méthode `get` en promesse
    const redisGet = promisify(this.client.get).bind(this.client);
    const vl = await redisGet(ky); // Obtient la valeur associée à la clé
    return vl; // Retourne la valeur obtenue
  }

  // Méthode pour définir une paire clé-valeur sur le serveur Redis
  async set(ky, vl, vltm) {
    // Convertit la méthode `set` en promesse
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(ky, vl); // Définit la valeur pour la clé spécifiée
    // Définit le temps d'expiration pour la clé en secondes
    await this.client.expire(ky, vltm);
  }

  // Méthode pour supprimer une paire clé-valeur du serveur Redis
  async del(ky) {
    // Convertit la méthode `del` en promesse
    const redisDel = promisify(this.client.del).bind(this.client);
    // supprimé
    await redisDel(ky); // Supprime la clé spécifiée
  }
}

// Création d'une instance de RedisClient et
// exportation pour utilisation dans d'autres modules
const redisClnt = new RedisClient();

module.exports = redisClnt; // Exportation de l'instance RedisClient
