// Importer le module Express depuis le répertoire 'node_modules'
// Express est un framework web pour Node.js
// qui simplifie la gestion des requêtes HTTP.
const express = require('express');

// Créer une instance de l'application Express.
// Cette instance sera utilisée pour configurer les routes,
// middleware et démarrer le serveur.
const app = express();

// Définir le port sur lequel le serveur va écouter les requêtes.
// On utilise une variable d'environnement PORT si elle est définie,
// sinon on se base sur le port 5000 par défaut.
const port = process.env.PORT || 5000;

// Charger les routes depuis le fichier 'routes/index.js'.
// Le fichier 'index.js' doit exporter un routeur Express
// contenant les définitions de routes pour l'application.
const routes = require('./routes/index');

// Utiliser le routeur importé pour gérer les
// requêtes envoyées à la racine du serveur ('/').
// Cela signifie que toutes les requêtes vers la racine et les sous-routes
// seront traitées par le routeur défini dans 'routes/index.js'.
app.use('/', routes);

// Démarrer le serveur sur le port défini précédemment.
// Lorsque le serveur démarre, un message est affiché
// dans la console indiquant le port sur lequel il écoute.
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
