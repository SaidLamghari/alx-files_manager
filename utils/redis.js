// utils/redis.js
const redis = require('redis'); // Importer le paquet Redis

// Définir la classe RedisClient
class RedisClient {
  constructor() {
    // Créer une nouvelle instance du client Redis
    this.client = redis.createClient();

    // Gérer les erreurs qui surviennent dans le client Redis
    // Afficher les erreurs dans la console
    this.client.on('error', (err) => {
      console.error('Erreur du client Redis :', err);
    });

    // Lier les méthodes pour garantir le bon contexte (`this`)
    this.isAlive = this.isAlive.bind(this);
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.del = this.del.bind(this);
  }

  /**
     * Vérifier si le client Redis est actuellement connecté
     * @returns {boolean} - Retourne true si le client est connecté, sinon false
     */
  isAlive() {
    return this.client.connected; // Retourner le statut de connexion du client Redis
  }

  /**
     * Obtenir la valeur associée à une clé donnée depuis Redis
     * @param {string} key - La clé pour laquelle récupérer la valeur
     * @returns {Promise<string|null>} - Une promesse qui se résout avec
     * la valeur associée à la clé, ou null si non trouvé
     */
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err); // Rejeter la promesse en cas d'erreur
        } else {
          resolve(reply); // Résoudre la promesse avec la valeur obtenue
        }
      });
    });
  }

  /**
     * Définir une valeur pour une clé donnée dans Redis avec un temps d'expiration
     * @param {string} key - La clé pour laquelle définir la valeur
     * @param {string} value - La valeur à stocker
     * @param {number} duration - Le temps d'expiration en secondes
     * @returns {Promise<string>} - Une promesse qui se résout avec la
     * réponse de Redis pour l'opération de définition
     */
  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err, reply) => {
        if (err) {
          reject(err); // Rejeter la promesse en cas d'erreur
        } else {
          resolve(reply); // Résoudre la promesse avec la réponse de Redis
        }
      });
    });
  }

  /**
     * Supprimer la valeur associée à une clé donnée dans Redis
     * @param {string} key - La clé à supprimer
     * @returns {Promise<number>} - Une promesse qui se résout avec
     * le nombre de clés supprimées (0 ou 1)
     */
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          reject(err); // Rejeter la promesse en cas d'erreur
        } else {
          resolve(reply); // Résoudre la promesse avec le nombre de clés supprimées
        }
      });
    });
  }
}

// Créer et exporter une
// instance unique de RedisClient
const redisClient = new RedisClient();
module.exports = redisClient;
