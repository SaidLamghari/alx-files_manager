// controllers/UsersController.js
// import
// controllers/UsersController.js
import sha1 from 'sha1';
import Queue from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

// Create a Bull queue instance for user email jobs
const userQueue = new Queue('userQueue', {
  redis: {
    host: 'localhost', // Replace with your Redis host
    port: 6379, // Replace with your Redis port
  },
});

export default class UsersController {
  /**
   * Handles user creation.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const usersCollection = await dbClient.usersCollection();

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = sha1(password);

      // Create new user document
      const result = await usersCollection.insertOne({ email, password: hashedPassword });
      const userId = result.insertedId.toString();

      // Add user to queue for sending welcome email
      userQueue.add('sendWelcomeEmail', { userId });

      res.status(201).json({
        email,
        id: userId,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Fetches the details of the authenticated user.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  static async getMe(req, res) {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(200).json({
      email: user.email,
      id: user._id.toString(),
    });
  }
}
