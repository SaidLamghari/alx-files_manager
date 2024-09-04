// utils/db.js
// Importer MongoClient depuis le paquet mongodb
import { MongoClient } from 'mongodb'; // Importation de MongoClient depuis le module 'mongodb'

// Récupération de l'hôte de la base de données depuis les variables
// d'environnement ou utilisation de 'localhost' par défaut
const HOST = process.env.DB_HOST || 'localhost';

// Récupération du port de la base de données depuis
// les variables d'environnement ou utilisation de 27017 par défaut
const PORT = process.env.DB_PORT || 27017;

// Récupération du nom de la base de données depuis les
// variables d'environnement ou utilisation de 'files_manager' par défaut
const DATABASE = process.env.DB_DATABASE || 'files_manager';

// Construction de l'URL de connexion
// à MongoDB avec les paramètres récupérés
const lnk = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    // Création d'une instance de MongoClient avec l'URL de connexion, useUnifiedTopology
    // pour la gestion des topologies de serveur, et useNewUrlParser pour le parsing des URLs
    this.client = new MongoClient(lnk, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect() // Connexion au serveur MongoDB
      .then(() => {
        // Si la connexion est réussie, sélectionne la base de données spécifiée
        this.db = this.client.db(DATABASE);
      })
      .catch((err) => {
        // Gestion des erreurs de connexion
        console.log('Erreur de connexion à MongoDB:', err);
      });
  }

  /**
   * Vérifie si la connexion de ce client au serveur MongoDB est active.
   * @returns {boolean} - Vrai si la connexion est active, sinon faux.
   */
  isAlive() {
    // La méthode isConnected() est obsolète dans les versions récentes de MongoDB Node.js driver
    // Il est préférable d'utiliser des techniques de
    // vérification alternatives comme la gestion des erreurs
    // Retourne vrai si la connexion est active
    // NOTE: Cette méthode est obsolète dans les versions récentes, à remplacer
    return this.client.isConnected();
  }

  /**
   * Récupère le nombre d'utilisateurs dans la base de données.
   * @returns {Promise<Number>} - Une promesse qui résout le nombre d'utilisateurs.
   */
  async nbUsers() {
    // Récupère une référence à la collection 'users' dans la base de données
    // NOTE: Utiliser 'this.db' plutôt que 'this.client.db()' après la connexion
    const vusrs = this.db.collection('users');
    // Compte le nombre de documents dans la collection 'users'
    const vusrsNum = await vusrs.countDocuments();
    return vusrsNum; // Retourne le nombre d'utilisateurs
  }

  /**
   * Récupère le nombre de fichiers dans la base de données.
   * @returns {Promise<Number>} - Une promesse qui résout le nombre de fichiers.
   */
  async nbFiles() {
    // Récupère une référence à la collection 'files' dans la base de données
    // NOTE: Utiliser 'this.db' plutôt que 'this.client.db()' après la connexion
    const vfles = this.db.collection('files');
    // Compte le nombre de documents dans la collection 'files'
    const vflesNum = await vfles.countDocuments();
    return vflesNum; // Retourne le nombre de fichiers
  }
}

// Création d'une instance unique de DBClient
// pour être utilisée partout dans l'application
// Exporte une instance unique de DBClient
export const dbClient = new DBClient();
export default dbClient; // Exporte par défaut la même instance unique
