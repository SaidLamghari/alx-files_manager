// Importer le client Redis depuis
// le module utilitaire 'redis'
// Ce client permet de vérifier
// l'état de la connexion à Redis.
// said

// Importation du client Redis depuis le fichier utils/redis
import redisClient from '../utils/redis';

// Importation du client de base de données depuis le fichier utils/db
import dbClient from '../utils/db';

class AppController {
  // Méthode statique pour obtenir le statut des services
  static getStatus(rq, rpn) {
    // Envoie une réponse JSON avec le statut de la connexion
    // Redis et de la connexion à la base de données
    rpn.status(200).json({
      // Vérifie si la connexion Redis est active
      redis: redisClient.isAlive(),
      // Vérifie si la connexion à la base de données est active
      db: dbClient.isAlive(),
    });
  }

  // Méthode statique pour obtenir des statistiques
  // sur le nombre d'utilisateurs et de fichiers
  static async getStats(rq, rpn) {
    try {
      // Obtient le nombre d'utilisateurs depuis la base de données
      const vusrnm = await dbClient.nbUsers();
      // Obtient le nombre de fichiers depuis la base de données
      const vflenm = await dbClient.nbFiles();
      // Envoie une réponse JSON avec les statistiques des utilisateurs et des fichiers
      rpn.status(200).json({
        users: vusrnm, // Nombre d'utilisateurs
        files: vflenm, // Nombre de fichiers
      });
    } catch (error) {
      // En cas d'erreur, renvoie une réponse d'erreur
      // avec le code HTTP 500 (erreur serveur interne)
      rpn.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Exportation du contrôleur pour qu'il puisse
// être utilisé dans d'autres parties de l'application
module.exports = AppController;
