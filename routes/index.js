import { Router } from 'express'; // Importation de l'objet Router depuis Express
import AppController from '../controllers/AppController'; // Importation du contrôleur principal pour les fonctions liées à l'application
import UsersController from '../controllers/UsersController'; // Importation du contrôleur pour les fonctions liées aux utilisateurs
import AuthController from '../controllers/AuthController'; // Importation du contrôleur pour les fonctions liées à l'authentification
import FilesController from '../controllers/FilesController'; // Importation du contrôleur pour les fonctions liées aux fichiers

const router = Router(); // Création d'une instance de Router pour définir les routes de l'application

// Route pour obtenir l'état actuel du serveur
router.get('/status', AppController.getStatus);

// Route pour obtenir des statistiques ou des informations générales sur l'application
router.get('/stats', AppController.getStats);

// Route pour créer un nouvel utilisateur
router.post('/users', UsersController.postNew);

// Route pour établir une connexion utilisateur (par exemple, pour démarrer une session)
router.get('/connect', AuthController.getConnect);

// Route pour déconnecter l'utilisateur (par exemple, pour mettre fin à une session)
router.get('/disconnect', AuthController.getDisconnect);

// Route pour obtenir les informations de l'utilisateur actuellement connecté
router.get('/users/me', UsersController.getMe);

// Route pour télécharger un fichier (par exemple, pour permettre aux utilisateurs d'ajouter de nouveaux fichiers)
router.post('/files', FilesController.postUpload);

// Route pour obtenir les détails d'un fichier spécifique en utilisant son identifiant
router.get('/files/:id', FilesController.getShow);

// Route pour obtenir la liste des fichiers disponibles
router.get('/files', FilesController.getIndex);

// Route pour publier un fichier spécifique (par exemple, pour le rendre accessible publiquement)
router.put('/files/:id/publish', FilesController.putPublish);

// Route pour retirer la publication d'un fichier spécifique (par exemple, pour le rendre inaccessible publiquement)
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// Route pour obtenir les données d'un fichier spécifique (par exemple, pour télécharger le contenu du fichier)
router.get('/files/:id/data', FilesController.getFile);

module.exports = router; // Exportation du routeur pour qu'il puisse être utilisé dans d'autres parties de l'application
