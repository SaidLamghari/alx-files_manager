// controllers/UsersController.js
// import
import sha1 from 'sha1'; // Importation de la bibliothèque sha1 pour le hachage des mots de passe
import { ObjectId } from 'mongodb'; // Importation d'ObjectId pour travailler avec les identifiants MongoDB
import Queue from 'bull'; // Importation de Bull pour la gestion des queues
import dbClient from '../utils/db'; // Importation du client MongoDB depuis le module utils/db
import redisClient from '../utils/redis'; // Importation du client Redis depuis le module utils/redis

// Création d'une queue pour les tâches liées aux utilisateurs
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  /**
   * Crée un nouvel utilisateur.
   * @param {Object} request - La requête HTTP contenant les données du nouvel utilisateur.
   * @param {Object} response - La réponse HTTP pour renvoyer le résultat de l'opération.
   */
  static async postNew(request, response) {
    const { email, password } = request.body;

    // Vérifie la présence de l'email et du mot de passe dans la requête
    if (!email) {
      return response.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return response.status(400).json({ error: 'Missing password' });
    }

    try {
      const users = dbClient.db.collection('users'); // Accède à la collection des utilisateurs dans MongoDB
      const existingUser = await users.findOne({ email }); // Vérifie si l'utilisateur existe déjà

      if (existingUser) {
        return response.status(400).json({ error: 'User already exists' }); // Retourne une erreur si l'utilisateur existe
      }

      const hashedPassword = sha1(password); // Hache le mot de passe avec sha1
      const result = await users.insertOne({
        email,
        password: hashedPassword,
      }); // Insère le nouvel utilisateur dans la base de données

      // Ajoute une tâche à la queue pour traitement ultérieur
      userQueue.add({ userId: result.insertedId });

      // Répond avec les détails du nouvel utilisateur
      return response.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error); // Journalise l'erreur en cas de problème
      return response.status(500).json({ error: 'Internal server error' }); // Répond avec une erreur interne du serveur
    }
  }

  /**
   * Récupère les informations de l'utilisateur courant à partir du token d'authentification.
   * @param {Object} request - La requête HTTP contenant le token d'authentification.
   * @param {Object} response - La réponse HTTP pour renvoyer les informations de l'utilisateur.
   */
  static async getMe(request, response) {
    const token = request.header('X-Token'); // Récupère le token d'authentification depuis l'en-tête

    if (!token) {
      return response.status(401).json({ error: 'Missing token' }); // Retourne une erreur si le token est absent
    }

    const key = `auth_${token}`; // Crée la clé pour accéder au token dans Redis

    try {
      const userId = await redisClient.get(key); // Récupère l'ID utilisateur depuis Redis

      if (!userId) {
        console.log('Authentication error: Token not found'); // Journalise une erreur si le token n'est pas trouvé
        return response.status(401).json({ error: 'Unauthorized' }); // Répond avec une erreur non autorisée
      }

      const users = dbClient.db.collection('users'); // Accède à la collection des utilisateurs dans MongoDB
      const user = await users.findOne({ _id: new ObjectId(userId) });
      // Recherche l'utilisateur par son ID

      if (user) {
        // Répond avec les détails de l'utilisateur
        return response.status(200).json({ id: userId, email: user.email });
      }

      // Répond avec une erreur non autorisée si l'utilisateur n'est pas trouvé
      return response.status(401).json({ error: 'Unauthorized' });
    } catch (error) {
      console.error('Error retrieving user:', error); // Journalise l'erreur en cas de problème
      // Répond avec une erreur interne du serveur
      return response.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;
