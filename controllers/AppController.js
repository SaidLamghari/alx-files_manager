// Importer le client Redis depuis
// le module utilitaire 'redis'
// Ce client permet de vérifier
// l'état de la connexion à Redis.
const redisClient = require('../utils/redis');

// Importer le client de base de données depuis le module utilitaire 'db'
// Ce client est utilisé pour vérifier l'état de la
// connexion à la base de données et pour obtenir des statistiques.
const dbClient = require('../utils/db');

// Contrôleur pour obtenir le statut de Redis et de la base de données
// Cette fonction est asynchrone pour permettre
// l'attente des réponses des vérifications d'état.
async function getStatus(req, res) {
  try {
    // Vérifier si Redis est opérationnel
    const redisStatus = redisClient.isAlive();

    // Vérifier si la base de données est opérationnelle
    const dbStatus = dbClient.isAlive();

    // Envoyer une réponse JSON avec le statut des deux services
    // Le statut HTTP 200 indique
    // que la requête a été traitée avec succès.
    return res.status(200).json({ redis: redisStatus, db: dbStatus });
  } catch (error) {
    // En cas d'erreur, envoyer une réponse JSON avec le message d'erreur
    // Le statut HTTP 500 indique une erreur interne du serveur.
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Contrôleur pour obtenir le nombre d'utilisateurs et de fichiers
// Cette fonction est asynchrone pour permettre
// l'attente des réponses des requêtes à la base de données.
async function getStats(req, res) {
  try {
    // Vérifier si la base de données est opérationnelle avant de faire des requêtes
    if (!dbClient.isAlive()) {
      // Si la base de données n'est pas connectée, renvoyer une erreur avec le statut HTTP 500
      return res.status(500).json({ error: 'Database is not connected' });
    }

    // Obtenir le nombre d'utilisateurs depuis la base de données
    const usersCount = await dbClient.nbUsers();

    // Obtenir le nombre de fichiers depuis la base de données
    const filesCount = await dbClient.nbFiles();

    // Envoyer une réponse JSON avec le nombre d'utilisateurs et de fichiers
    // Le statut HTTP 200 indique que la requête a été traitée avec succès.
    return res.status(200).json({ users: usersCount, files: filesCount });
  } catch (error) {
    // En cas d'erreur, envoyer une réponse JSON avec le message d'erreur
    // Le statut HTTP 500 indique une erreur interne du serveur.
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Exporter les fonctions de contrôleur pour
// qu'elles puissent être utilisées dans les routes
module.exports = {
  getStatus,
  getStats,
};
