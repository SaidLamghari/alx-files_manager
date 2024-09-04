// Importer le client Redis depuis
// le module utilitaire 'redis'
// Ce client permet de vérifier
// l'état de la connexion à Redis.
// said
import redisClient from '../utils/redis'; // Importation du client Redis depuis le fichier utils/redis
import dbClient from '../utils/db'; // Importation du client de base de données depuis le fichier utils/db

class AppController {
  // Méthode statique pour obtenir le statut des services
  static getStatus(request, response) {
    // Envoie une réponse JSON avec le statut de la connexion Redis et de la connexion à la base de données
    response.status(200).json({
      redis: redisClient.isAlive(), // Vérifie si la connexion Redis est active
      db: dbClient.isAlive(), // Vérifie si la connexion à la base de données est active
    });
  }

  // Méthode statique pour obtenir des statistiques sur le nombre d'utilisateurs et de fichiers
  static async getStats(request, response) {
    try {
      // Obtient le nombre d'utilisateurs depuis la base de données
      const usersNum = await dbClient.nbUsers();
      // Obtient le nombre de fichiers depuis la base de données
      const filesNum = await dbClient.nbFiles();
      // Envoie une réponse JSON avec les statistiques des utilisateurs et des fichiers
      response.status(200).json({
        users: usersNum, // Nombre d'utilisateurs
        files: filesNum, // Nombre de fichiers
      });
    } catch (error) {
      // En cas d'erreur, renvoie une réponse d'erreur avec le code HTTP 500 (erreur serveur interne)
      response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

// Exportation du contrôleur pour qu'il puisse être utilisé dans d'autres parties de l'application
module.exports = AppController;
