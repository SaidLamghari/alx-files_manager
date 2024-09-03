// Importer le module 'crypto' pour
// le hachage des mots de passe
// Ce module est utilisé pour créer
// des hachages sécurisés des mots de passe.
const crypto = require('crypto');

// Importer le client de base de données depuis le module utilitaire 'db'
// Ce client est utilisé pour interagir avec la
// base de données, notamment pour les opérations liées aux utilisateurs.
const dbClient = require('../utils/db');

// Contrôleur pour créer un nouvel utilisateur
// Cette fonction est asynchrone pour permettre
// l'attente des opérations sur la base de données.
async function postNew(req, res) {
  try {
    // Extraire les données de la requête POST
    const { email, password } = req.body;

    // Valider les entrées de l'utilisateur
    // Vérifier que l'email est fourni
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Vérifier que le mot de passe est fourni
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Vérifier si l'email existe déjà dans la base de données
    const usersCollection = dbClient.db.collection('users');

    // Rechercher un utilisateur existant avec le même email
    const existingUser = await usersCollection.findOne({ email });

    // Si l'utilisateur existe déjà, renvoyer une erreur
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hacher le mot de passe pour le stockage sécurisé
    // Utiliser l'algorithme de hachage SHA-1
    // pour créer un hachage du mot de passe
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Créer un nouvel utilisateur avec
    // l'email et le mot de passe haché
    const result = await usersCollection.insertOne({ email, password: hashedPassword });

    // Créer un objet représentant le nouvel utilisateur
    // Inclure l'ID généré par la base de données et l'email
    const newUser = { id: result.insertedId.toString(), email };

    // Retourner une réponse JSON avec le nouvel utilisateur
    // Le statut HTTP 201 indique
    // que la ressource a été créée avec succès.
    return res.status(201).json(newUser);
  } catch (error) {
    // En cas d'erreur, enregistrer l'erreur
    // dans la console et renvoyer une réponse JSON
    // Le statut HTTP 500 indique une erreur interne du serveur.
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Exporter la fonction 'postNew' pour
// qu'elle puisse être utilisée dans les routes
module.exports = {
  postNew,
};
