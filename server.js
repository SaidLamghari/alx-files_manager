// Importer le module Express depuis le répertoire 'node_modules'
// Express est un framework web pour Node.js
// qui simplifie la gestion des requêtes HTTP.
// said
import express from 'express';  // Importation du module Express
import router from './routes/index';  // Importation du routeur défini dans le fichier './routes/index'

// Définition du port d'écoute. Utilise la variable d'environnement PORT ou 5000 par défaut.
const port = parseInt(process.env.PORT, 10) || 5000;

// Création de l'application Express
const app = express();

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Utilisation du routeur pour gérer les routes de l'application
app.use('/', router);

// Démarrage du serveur et écoute sur le port spécifié
app.listen(port, () => {
  // Message de confirmation affiché dans la console lorsque le serveur démarre
  console.log(`server running on port ${port}`);
});

// Exportation de l'application Express pour pouvoir 
// l'utiliser dans d'autres modules (par exemple, pour les tests)
export default app;

