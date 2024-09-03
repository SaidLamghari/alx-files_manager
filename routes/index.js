// Importer le module Express
// pour pouvoir utiliser le routeur
const express = require('express');

// Créer une instance du routeur Express
// Le routeur est utilisé pour définir des routes
// et leurs gestionnaires de manière modulaire.
const router = express.Router();

// Importer le contrôleur qui contient la logique pour les routes
// Le contrôleur est responsable de la gestion des
// requêtes et des réponses pour les différentes routes.
const AppController = require('../controllers/AppController');

// Définir la route pour obtenir le statut de l'application
// La méthode 'getStatus' du contrôleur 'AppController' sera appelée
// lorsque la route '/status' sera accédée via une requête GET.
router.get('/status', AppController.getStatus);

// Définir la route pour obtenir des statistiques de l'application
// La méthode 'getStats' du contrôleur 'AppController' sera appelée
// lorsque la route '/stats' sera accédée via une requête GET.
router.get('/stats', AppController.getStats);

// Exporter le routeur pour qu'il puisse être utilisé dans
// d'autres fichiers de l'application
// En exportant le routeur, nous permettons à 'server.js' ou à d'autres
// modules de l'application de l'utiliser pour gérer les routes définies ici.
module.exports = router;
