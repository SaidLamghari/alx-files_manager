// controllers/AuthController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Clé secrète pour signer les tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Durée d'expiration des tokens JWT
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

class AuthController {
  /**
   * Authentifie un utilisateur et génère un token JWT.
   * Expects email et password dans le corps de la requête.
   * @param {Object} req - La requête HTTP.
   * @param {Object} res - La réponse HTTP.
   * @returns {Object} La réponse HTTP avec le token JWT ou une erreur.
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Vérifie que l'email et le mot de passe sont fournis
      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      const users = dbClient.db.collection('users');
      // Recherche l'utilisateur dans la base de données par email
      const user = await users.findOne({ email });

      if (!user) {
        // Retourne une erreur si l'utilisateur n'est pas trouvé
        return res.status(401).json({ error: 'Email ou mot de passe invalide' });
      }

      // Compare le mot de passe fourni avec le mot de passe haché stocké
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        // Retourne une erreur si les mots de passe ne correspondent pas
        return res.status(401).json({ error: 'Email ou mot de passe invalide' });
      }

      // Crée un payload avec l'ID et l'email de l'utilisateur
      const payload = { id: user._id, email: user.email };
      // Génère un token JWT signé avec la clé secrète et la durée d'expiration
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

      // Stocke le token dans Redis avec une expiration de 1 heure
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 'EX', 3600);

      // Retourne le token JWT dans la réponse
      return res.status(200).json({ token });
    } catch (error) {
      // En cas d'erreur, log l'erreur et retourne une réponse d'erreur 500
      console.error('Erreur lors de la connexion :', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  /**
   * Déconnecte l'utilisateur en supprimant le token de Redis.
   * Expects X-Token dans les en-têtes de la requête.
   * @param {Object} req - La requête HTTP.
   * @param {Object} res - La réponse HTTP.
   * @returns {Object} La réponse HTTP avec un message de succès ou une erreur.
   */
  static async logout(req, res) {
    try {
      const token = req.header('X-Token');

      // Vérifie que le token est fourni dans les en-têtes
      if (!token) {
        return res.status(400).json({ error: 'Token requis' });
      }

      // Crée la clé Redis pour le token et le supprime
      const key = `auth_${token}`;
      await redisClient.del(key);

      // Retourne un message de succès
      return res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
      // En cas d'erreur, log l'erreur et retourne une réponse d'erreur 500
      console.error('Erreur lors de la déconnexion :', error);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  /**
   * Vérifie la validité du token JWT et autorise l'accès.
   * Expects X-Token dans les en-têtes de la requête.
   * @param {Object} req - La requête HTTP.
   * @param {Object} res - La réponse HTTP.
   * @param {Function} next - La fonction middleware pour passer au prochain middleware.
   * @returns {Object} La réponse HTTP ou appelle la fonction next().
   */
  static async verifyToken(req, res, next) {
    try {
      const token = req.header('X-Token');

      // Vérifie que le token est présent dans les en-têtes
      if (!token) {
        return res.status(401).json({ error: 'Token requis' });
      }

      // Crée la clé Redis pour le token et récupère l'ID utilisateur
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      // Vérifie si le token est valide en Redis
      if (!userId) {
        return res.status(401).json({ error: 'Non autorisé' });
      }

      // Vérifie et décode le token JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      // Stocke l'ID utilisateur décodé dans la requête pour une utilisation ultérieure
      req.userId = decoded.id;

      // Passe au prochain middleware ou route handler
      return next();
    } catch (error) {
      // En cas d'erreur de vérification du token, log l'erreur et retourne une réponse d'erreur 401
      console.error('Échec de la vérification du token :', error);
      return res.status(401).json({ error: 'Non autorisé' });
    }
  }
}

export default AuthController;
