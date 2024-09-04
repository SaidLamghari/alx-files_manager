// utils/db.js
// Importer MongoClient depuis le paquet mongodb
// said
import { MongoClient } from 'mongodb'; // Importation de MongoClient depuis le module mongodb

// Définition des variables d'environnement pour la connexion à la base de données
const HOST = process.env.DB_HOST || 'localhost'; // Hôte de la base de données (défaut : localhost)
const PORT = process.env.DB_PORT || 27017; // Port de la base de données (défaut : 27017)
const DATABASE = process.env.DB_DATABASE || 'files_manager'; // Nom de la base de données (défaut : 'files_manager')
const url = `mongodb://${HOST}:${PORT}`; // URL de connexion à MongoDB

class DBClient {
  constructor() {
    // Création d'une instance de MongoClient avec des options de configuration
    this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });

    // Connexion à la base de données
    this.client.connect().then(() => {
      // Initialisation de l'objet db avec la base de données spécifiée
      this.db = this.client.db(`${DATABASE}`);
    }).catch((err) => {
      // Gestion des erreurs de connexion
      console.log(err);
    });
  }

  // Méthode pour vérifier si la connexion à la base de données est active
  isAlive() {
    // Note : `isConnected` est obsolète dans les versions récentes de MongoDB Node.js Driver.
    // Utilisez `client.topology.isConnected()` à la place.
    return this.client.isConnected(); // Retourne true si la connexion est active, sinon false
  }

  // Méthode pour obtenir le nombre d'utilisateurs dans la collection 'users'
  async nbUsers() {
    const users = this.db.collection('users'); // Accès à la collection 'users'
    const usersNum = await users.countDocuments(); // Compte le nombre de documents dans la collection
    return usersNum; // Retourne le nombre d'utilisateurs
  }

  // Méthode pour obtenir le nombre de fichiers dans la collection 'files'
  async nbFiles() {
    const files = this.db.collection('files'); // Accès à la collection 'files'
    const filesNum = await files.countDocuments(); // Compte le nombre de documents dans la collection
    return filesNum; // Retourne le nombre de fichiers
  }
}

// Création d'une instance de DBClient et exportation pour utilisation dans d'autres modules
const dbClient = new DBClient();
module.exports = dbClient;
