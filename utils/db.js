// utils/db.js
// Importer MongoClient depuis le paquet mongodb
// said

// Importation de MongoClient depuis le module mongodb
import { MongoClient } from 'mongodb';

// Définition des variables d'environnement pour la connexion à la base de données
// Port de la base de données (défaut : 27017)
const PORT = process.env.DB_PORT || 27017;
// Hôte de la base de données (défaut : localhost)
const HOST = process.env.DB_HOST || 'localhost';
// Nom de la base de données (défaut : 'files_manager')
const DATABASE = process.env.DB_DATABASE || 'files_manager';
// URL de connexion à MongoDB
const lnk = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    // Création d'une instance de MongoClient avec des options de configuration
    this.client = new MongoClient(
      lnk, { useUnifiedTopology: true, useNewUrlParser: true },
    );

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
    // Note : `isConnected` est obsolète dans
    // les versions récentes de MongoDB Node.js Driver.
    // Utilisez `client.topology.isConnected()` à la place.
    // Retourne true si la connexion est active, sinon false
    return this.client.isConnected();
  }

  // Méthode pour obtenir le nombre d'utilisateurs dans la collection 'users'
  async nbUsers() {
    // Accès à la collection 'users'
    const users = this.db.collection('users');
    // Compte le nombre de documents dans la collection
    const vusrnm = await users.countDocuments();
    return vusrnm; // Retourne le nombre d'utilisateurs
  }

  // Méthode pour obtenir le nombre de fichiers dans la collection 'files'
  async nbFiles() {
    // Accès à la collection 'files'
    const fls = this.db.collection('files');
    // Compte le nombre de documents dans la collection
    const vflnm = await fls.countDocuments();
    return vflnm; // Retourne le nombre de fichiers
  }
}

// Création d'une instance de DBClient et
// exportation pour utilisation dans d'autres modules
const dbvClnt = new DBClient();
module.exports = dbvClnt;
