// Importer le module Express
// pour pouvoir utiliser le routeur
const express = require('express');

// Créer une instance du routeur Express
// Le routeur est utilisé pour définir
// les routes de l'application de manière modulaire.
const router = express.Router();

// Importer le contrôleur des applications depuis le module 'controllers/AppController'
// Ce contrôleur contient la logique pour
// les routes liées au statut et aux statistiques de l'application.
const AppController = require('../controllers/AppController');

// Importer le contrôleur des utilisateurs depuis le module 'controllers/UsersController'
// Ce contrôleur contient la logique pour les opérations
// liées aux utilisateurs, comme la création de nouveaux utilisateurs.
const UsersController = require('../controllers/UsersController');

// Définir la route pour obtenir le statut de l'application
// Lorsque la route '/status' est accédée via une requête HTTP GET,
// la méthode 'getStatus' du contrôleur 'AppController' est appelée.
router.get('/status', AppController.getStatus);

// Définir la route pour obtenir des statistiques de l'application
// Lorsque la route '/stats' est accédée via une requête HTTP GET,
// la méthode 'getStats' du contrôleur 'AppController' est appelée.
router.get('/stats', AppController.getStats);

// Définir la route pour créer un nouvel utilisateur
// Lorsque la route '/users' est accédée via une requête HTTP POST,
// la méthode 'postNew' du contrôleur 'UsersController' est appelée.
// Cette méthode gère la création d'un nouvel utilisateur dans l'application.
router.post('/users', UsersController.postNew);

// Exporter le routeur pour qu'il puisse être utilisé dans le fichier principal du serveur
// En exportant le routeur, nous permettons à 'server.js' ou
// à d'autres modules de l'application de l'utiliser pour gérer les routes définies ici.
module.exports = router;
