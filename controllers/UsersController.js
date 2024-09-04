import sha1 from 'sha1'; // Importation de la bibliothèque pour le hachage SHA-1
import { ObjectID } from 'mongodb'; // Importation de l'ObjectID pour MongoDB
import Queue from 'bull'; // Importation de Bull pour la gestion des files d'attente avec Redis
import dbClient from '../utils/db'; // Importation du client de base de données
import redisClient from '../utils/redis'; // Importation du client Redis

// Création d'une nouvelle file d'attente Bull pour la gestion des tâches utilisateur
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  // Méthode statique pour créer un nouvel utilisateur
  static postNew(request, response) {
    const { email } = request.body; // Extraction de l'email depuis le corps de la requête
    const { password } = request.body; // Extraction du mot de passe depuis le corps de la requête

    // Vérification de la présence de l'email
    if (!email) {
      response.status(400).json({ error: 'Missing email' }); // Réponse en cas d'email manquant
      return;
    }
    // Vérification de la présence du mot de passe
    if (!password) {
      response.status(400).json({ error: 'Missing password' }); // Réponse en cas de mot de passe manquant
      return;
    }

    // Récupération de la collection des utilisateurs
    const users = dbClient.db.collection('users');
    // Recherche d'un utilisateur avec l'email fourni
    users.findOne({ email }, (err, user) => {
      if (user) {
        response.status(400).json({ error: 'Already exist' }); // Réponse si l'utilisateur existe déjà
      } else {
        const hashedPassword = sha1(password); // Hachage du mot de passe avec SHA-1
        // Insertion du nouvel utilisateur dans la base de données
        users.insertOne(
          {
            email,
            password: hashedPassword,
          },
        ).then((result) => {
          response.status(201).json({ id: result.insertedId, email }); // Réponse avec l'ID et l'email de l'utilisateur créé
          // Ajout de la tâche à la file d'attente Bull
          userQueue.add({ userId: result.insertedId });
        }).catch((error) => console.log(error)); // Gestion des erreurs lors de l'insertion
      }
    });
  }

  // Méthode statique pour obtenir les informations de l'utilisateur connecté
  static async getMe(request, response) {
    const token = request.header('X-Token'); // Récupération du token depuis l'en-tête de la requête
    const key = `auth_${token}`; // Création de la clé Redis pour récupérer l'ID utilisateur
    const userId = await redisClient.get(key); // Récupération de l'ID utilisateur depuis Redis
    if (userId) {
      // Récupération de la collection des utilisateurs
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId); // Création d'un ObjectID à partir de l'ID utilisateur
      // Recherche de l'utilisateur dans la base de données
      users.findOne({ _id: idObject }, (err, user) => {
        if (user) {
          response.status(200).json({ id: userId, email: user.email }); // Réponse avec les informations de l'utilisateur
        } else {
          response.status(401).json({ error: 'Unauthorized' }); // Réponse si l'utilisateur n'est pas autorisé
        }
      });
    } else {
      console.log('Hupatikani!'); // Message de log si l'utilisateur n'est pas trouvé dans Redis
      response.status(401).json({ error: 'Unauthorized' }); // Réponse si le token est invalide ou absent
    }
  }
}

module.exports = UsersController; // Exportation du contrôleur pour qu'il puisse être utilisé dans d'autres parties de l'application
