// controllers/UsersController.js
// import
// controllers/UsersController.js
// Importation du client de base de données
// Importation du module sha1 pour le hachage des mots de passe
const crypto = require('crypto');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const db = dbClient.client.db(dbClient.database);
      const usersCollection = db.collection('users');

      // Check if the email already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Create new user
      const result = await usersCollection.insertOne({ email, password: hashedPassword });

      // Return the newly created user
      res.status(201).json({
        id: result.insertedId,
        email,
      });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
}

module.exports = UsersController;
