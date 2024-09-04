// Importer le module Express
// pour pouvoir utiliser le routeur
const express = require('express');
const router = express.Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

// Define existing routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// Define new route for creating users
router.post('/users', UsersController.postNew);

module.exports = router;

