// said
// Importation de la fonction sha1 pour le hachage des mots de passe
import sha1 from 'sha1';
// Importation de Bull pour la gestion des files d'attente
import Queue from 'bull';
// Importation de ObjectID pour la gestion des identifiants MongoDB
import { ObjectID } from 'mongodb';
// Importation du client Redis depuis le fichier utils/redis
import redisClient from '../utils/redis';
// Importation du client de base de données depuis le fichier utils/db
import dbClient from '../utils/db';

// Création d'une file d'attente Bull pour les utilisateurs,
// utilisant Redis comme serveur de gestion des queues
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  // Méthode statique pour créer un nouvel utilisateur
  static postNew(rqt, rpn) {
    // Extraction de l'email du corps de la requête
    const { email } = rqt.body;
    // Extraction du mot de passe du corps de la requête
    const { password } = rqt.body;

    // Vérification que l'email est fourni
    if (!email) {
      // Envoie une réponse d'erreur 400 si l'email est manquant
      rpn.status(400).json({ error: 'Missing email' });
      return;
    }

    // Vérification que le mot de passe est fourni
    if (!password) {
      // Envoie une réponse d'erreur 400 si le mot de passe est manquant
      rpn.status(400).json({ error: 'Missing password' });
      return;
    }

    // Accès à la collection 'users' dans la base de données
    const users = dbClient.db.collection('users');
    users.findOne({ email }, (err, user) => {
      if (user) {
        // Si un utilisateur avec cet email existe déjà, renvoie une erreur 400
        rpn.status(400).json({ error: 'Already exist' });
      } else {
        // Hachage du mot de passe
        const hshdPsswrd = sha1(password);
        // Insertion du nouvel utilisateur dans la collection 'users'
        users.insertOne(
          {
            email,
            password: hshdPsswrd,
          },
        ).then((result) => {
          // Réponse avec le statut 201 (créé) et les informations
          // de l'utilisateur nouvellement créé
          rpn.status(201).json({ id: result.insertedId, email });
          // Ajout d'un travail à la file d'attente pour
          // traiter des tâches liées à ce nouvel utilisateur
          userQueue.add({ userId: result.insertedId });
        }).catch((error) => {
          // Gestion des erreurs lors de l'insertion dans la base de données
          console.log(error);
        });
      }
    });
  }

  // Méthode statique pour obtenir les informations de l'utilisateur connecté
  static async getMe(rqt, rpn) {
    // Extraction du token d'authentification depuis les en-têtes de la requête
    const tkn = rqt.header('X-Token');
    const ky = `auth_${tkn}`; // Génération de la clé Redis associée au token
    // Récupération de l'ID utilisateur stocké dans Redis
    const userId = await redisClient.get(ky);
    if (userId) {
      // Si l'ID utilisateur est trouvé, obtenir
      // les détails de l'utilisateur depuis la base de données
      const users = dbClient.db.collection('users');
      // Création d'un ObjectID pour la recherche dans MongoDB
      const vidobj = new ObjectID(userId);
      users.findOne({ _id: vidobj }, (err, user) => {
        if (user) {
          // Si l'utilisateur est trouvé, renvoyer ses informations avec le statut 200
          rpn.status(200).json({ id: userId, email: user.email });
        } else {
          // Si l'utilisateur n'est pas trouvé, renvoyer une erreur 401 (non autorisé)
          rpn.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      // Si l'ID utilisateur n'est pas trouvé dans Redis,
      // renvoyer une erreur 401 (non autorisé)
      // Message de log pour indiquer que l'utilisateur n'a pas été trouvé
      console.log('Hupatikani!');
      rpn.status(401).json({ error: 'Unauthorized' });
    }
  }
}

// Exportation de la classe UsersController pour
// utilisation dans d'autres parties de l'application
module.exports = UsersController;
