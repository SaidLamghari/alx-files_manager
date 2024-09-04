// utils/db.js
// Importer MongoClient depuis le paquet mongodb
const { MongoClient } = require('mongodb');

// Définir la classe DBClient
class DBClient {
  constructor() {
    // Lire les variables d'environnement ou utiliser les valeurs par défaut
    // Adresse du serveur MongoDB, par défaut localhost
    const host = process.env.DB_HOST || 'localhost';
    // Port du serveur MongoDB, par défaut 27017
    const port = process.env.DB_PORT || 27017;
    // Nom de la base de données, par défaut 'files_manager'
    const database = process.env.DB_DATABASE || 'files_manager';

    // Créer l'URL de connexion à MongoDB en utilisant les
    // variables d'environnement ou les valeurs par défaut
    const uri = `mongodb://${host}:${port}/${database}`;

    // Créer une instance du client MongoDB avec l'URL de connexion
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Connexion au client MongoDB
    this.client.connect()
      .then(() => {
        // Log lorsque la connexion est établie avec succès
        console.log('Connecté à MongoDB');
        // Sélectionner la base de données spécifiée dans l'URL de connexion
        this.db = this.client.db(database);
      })
      .catch((err) => {
        // Log les erreurs de connexion si elles surviennent
        console.error('Erreur de connexion à MongoDB :', err);
      });

    // Lier les méthodes pour garantir le bon contexte (`this`)
    this.isAlive = this.isAlive.bind(this);
    this.nbUsers = this.nbUsers.bind(this);
    this.nbFiles = this.nbFiles.bind(this);
  }

  /**
     * Vérifier si la connexion au client MongoDB est active
     * @returns {boolean} - Retourne true si la connexion est active, sinon false
     */
  isAlive() {
    // Vérifier si la connexion au client MongoDB est établie
    // La méthode isConnected() indique si le client est connecté
    return this.client.isConnected();
  }

  /**
     * Compter le nombre de documents dans la collection 'users'
     * @returns {Promise<number>} - Une promesse qui se résout avec le nombre
     * de documents dans la collection 'users'
     */
  async nbUsers() {
    // Vérifier si la base de données est connectée avant de procéder
    // Lancer une erreur si la connexion n'est pas encore établie
    if (!this.db) throw new Error('Connexion à la base de données non établie');

    // Accéder à la collection 'users'
    const usersCollection = this.db.collection('users');
    // Compter le nombre de documents dans la collection
    const count = await usersCollection.countDocuments();
    return count; // Retourner le nombre de documents
  }

  /**
     * Compter le nombre de documents dans la collection 'files'
     * @returns {Promise<number>} - Une promesse qui se résout avec
     * le nombre de documents dans la collection 'files'
     */
  async nbFiles() {
    // Vérifier si la base de données est connectée avant de procéder
    // Lancer une erreur si la connexion n'est pas encore établie
    if (!this.db) throw new Error('Connexion à la base de données non établie');

    // Accéder à la collection 'files'
    const filesCollection = this.db.collection('files');
    // Compter le nombre de documents dans la collection
    const count = await filesCollection.countDocuments();
    return count; // Retourner le nombre de documents
  }
}

// Créer et exporter une instance unique de DBClient
const dbClient = new DBClient();
// Exporte l'instance pour qu'elle puisse
// être utilisée dans d'autres fichiers
module.exports = dbClient;
