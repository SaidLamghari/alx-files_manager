// controllers/UsersController.js
// import
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Création d'une nouvelle queue Bull pour les tâches utilisateur
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  /**
   * Crée un nouvel utilisateur.
   * Cette méthode attend un email et un mot de passe dans le corps de la requête.
   * Hache le mot de passe avant de le stocker dans la base de données.
   * Enfile une tâche pour le nouvel utilisateur dans la queue Bull.
   * @param {Object} req - La requête HTTP.
   * @param {Object} res - La réponse HTTP.
   * @returns {Object} La réponse HTTP avec l'état de la création de l'utilisateur.
   */
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      // Vérifie que l'email et le mot de passe sont fournis dans le corps de la requête
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const users = dbClient.db.collection('users');

      // Vérifie si un utilisateur avec cet email existe déjà
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        // Retourne une erreur si l'utilisateur existe déjà
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hache le mot de passe pour le stocker en toute sécurité
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insère le nouvel utilisateur dans la base de données
      const result = await users.insertOne({
        email,
        password: hashedPassword,
      });

      // Enfile une tâche pour le nouvel utilisateur dans la queue Bull
      userQueue.add({ userId: result.insertedId });

      // Retourne une réponse avec l'ID et l'email de l'utilisateur nouvellement créé
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      // En cas d'erreur, log l'erreur et retourne une réponse d'erreur 500
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Obtient les informations de l'utilisateur actuellement connecté.
   * Cette méthode attend un token d'authentification dans l'en-tête X-Token.
   * @param {Object} req - La requête HTTP.
   * @param {Object} res - La réponse HTTP.
   * @returns {Object} La réponse HTTP avec les informations de l'utilisateur ou une erreur.
   */
  static async getMe(req, res) {
    try {
      const token = req.header('X-Token');

      // Vérifie que le token est présent dans l'en-tête de la requête
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      // Création de la clé Redis pour récupérer les données de l'utilisateur
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      // Vérifie si le token est valide et récupère l'ID de l'utilisateur
      if (!userId) {
        console.log('Authentication error!');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const users = dbClient.db.collection('users');
      // Récupère les informations de l'utilisateur à partir de l'ID stocké dans Redis
      const user = await users.findOne({ _id: new ObjectId(userId) });

      // Retourne les détails de l'utilisateur s'il est trouvé
      if (user) {
        return res.status(200).json({ id: user._id, email: user.email });
      }
      // Retourne une erreur si l'utilisateur n'est pas trouvé
      return res.status(401).json({ error: 'Unauthorized' });
    } catch (error) {
      // En cas d'erreur, log l'erreur et retourne une réponse d'erreur 500
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
