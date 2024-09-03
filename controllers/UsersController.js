// controllers/UsersController.js
// import
// controllers/UsersController.js
// Importation du client de base de données
// Importation du module sha1 pour le hachage des mots de passe
import sha1 from 'sha1';
// Importation du module Queue de Bull
// pour la gestion des files d'attente
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

// Création d'une nouvelle
// file d'attente nommée 'email sending'
const userQueue = new Queue('email sending');

class UsersController {
  // Méthode statique pour traiter la création d'un nouvel utilisateur
  static async postNew(rq, rs) {
    // Extraction de l'email et du mot de passe depuis le corps de la requête
    const { email = null, password = null } = rq.body || {};

    // Vérification de la présence de l'email
    if (!email) {
      // Réponse avec un code d'état 400 si l'email est manquant
      rs.status(400).json({ error: 'Missing email' });
      return;
    }
    // Vérification de la présence du mot de passe
    if (!password) {
      // Réponse avec un code d'état 400 si le mot de passe est manquant
      rs.status(400).json({ error: 'Missing password' });
      return;
    }
    // Recherche de l'utilisateur dans la base de données par email
    const valuser = await (await dbClient.usersCollection()).findOne({ email });

    // Si l'utilisateur existe déjà, réponse avec une erreur
    if (valuser) {
      // Réponse avec un code d'état 400 si l'utilisateur existe déjà
      rs.status(400).json({ error: 'Already exist' });
      return;
    }
    // Insertion du nouvel utilisateur dans la base de données avec le mot de passe haché
    const insertionInfo = await (await dbClient.usersCollection())
      .insertOne({ email, password: sha1(password) });
    // Récupération de l'identifiant de l'utilisateur nouvellement inséré
    const userId = insertionInfo.insertedId.toString();

    // Ajout d'une tâche dans la file d'attente pour l'envoi d'un email
    userQueue.add({ userId });
    // Réponse avec un code d'état 201 et les informations de l'utilisateur créé
    rs.status(201).json({ email, id: userId });
  }

  // Méthode statique pour obtenir les informations de l'utilisateur courant
  static async getMe(rq, rs) {
    // Récupération des informations de l'utilisateur depuis l'objet de requête
    const { valuser } = rq;

    // Réponse avec un code d'état 200 et les informations de l'utilisateur
    rs.status(200).json({ email: valuser.email, id: valuser._id.toString() });
  }
}

export default UsersController;
