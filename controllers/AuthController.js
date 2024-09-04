// controllers/AuthController.js
// said
// Importation de la fonction sha1 pour le hachage des mots de passe
import sha1 from 'sha1';
// Importation de la fonction uuidv4 pour générer des tokens unique
import { v4 as uuidv4 } from 'uuid';
// Importation du client Redis depuis le fichier utils/redis
import redisClient from '../utils/redis';
// Importation du client de base de données depuis le fichier utils/db
import dbClient from '../utils/db';

class AuthController {
  // Méthode statique pour gérer la connexion des utilisateurs
  static async getConnect(rqt, rsp) {
    // Récupération des données d'authentification depuis l'en-tête 'Authorization'
    const valthdt = rqt.header('Authorization');
    // Décodage des données d'authentification en base64
    // Séparation du type d'authentification et des données
    let vlusrEml = valthdt.split(' ')[1];
    // Création d'un buffer à partir de la chaîne encodée en base64
    const valbff = Buffer.from(vlusrEml, 'base64');
    vlusrEml = valbff.toString('ascii'); // Décodage du buffer en chaîne ASCII
    const data = vlusrEml.split(':'); // Séparation de l'email et du mot de passe

    // Vérification que les données contiennent à la fois l'email et le mot de passe
    if (data.length !== 2) {
      // Envoie une réponse d'erreur 401 si les données sont incorrectes
      rsp.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hshdPsswrd = sha1(data[1]); // Hachage du mot de passe
    // Accès à la collection 'users' dans la base de données
    const users = dbClient.db.collection('users');
    // Recherche d'un utilisateur correspondant à l'email et au mot de passe haché
    users.findOne({ email: data[0], password: hshdPsswrd }, async (err, user) => {
      if (user) {
        // Si l'utilisateur est trouvé, générer un token unique
        const token = uuidv4();
        const ky = `auth_${token}`; // Création d'une clé Redis associée au token
        // Stocker l'ID utilisateur dans Redis avec une expiration de 24 heures
        await redisClient.set(ky, user._id.toString(), 60 * 60 * 24);
        // Envoie une réponse avec le token d'authentification
        rsp.status(200).json({ token });
      } else {
        // Si l'utilisateur n'est pas trouvé, renvoyer une erreur 401 (non autorisé)
        rsp.status(401).json({ error: 'Unauthorized' });
      }
    });
  }

  // Méthode statique pour gérer la déconnexion des utilisateurs
  static async getDisconnect(rqt, rsp) {
    // Récupération du token d'authentification depuis l'en-tête 'X-Token'
    const token = rqt.header('X-Token');
    const ky = `auth_${token}`; // Création de la clé Redis associée au token
    // Récupération de l'ID utilisateur associé au token depuis Redis
    const id = await redisClient.get(ky);
    if (id) {
      // Si l'ID est trouvé, supprimer la clé du
      // token de Redis pour déconnecter l'utilisateur
      await redisClient.del(ky);
      // Envoie une réponse avec le statut 204 (aucun contenu)
      // pour indiquer une déconnexion réussie
      rsp.status(204).json({});
    // else
    } else {
      // Si le token n'est pas trouvé dans Redis,
      // renvoyer une erreur 401 (non autorisé)
      rsp.status(401).json({ error: 'Unauthorized' });
    }
  }
}

// Exportation de la classe AuthController pour qu'elle puisse
// être utilisée dans d'autres parties de l'application
module.exports = AuthController;
