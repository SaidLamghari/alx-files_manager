// Importer le module Express
// pour pouvoir utiliser le routeur
const express = require('express');

const router = express.Router();

// Importation des contrôleurs
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

// Route pour vérifier l'état de l'application
// Cette route répondra avec un statut indiquant
// si l'application fonctionne correctement
router.get('/status', AppController.getStatus);

// Route pour obtenir des statistiques sur l'application
// Cette route pourrait fournir des données telles que le nombre
// d'utilisateurs, le nombre de fichiers, etc.
router.get('/stats', AppController.getStats);

// Route pour créer un nouvel utilisateur
// Cette route permet de créer un nouvel utilisateur en envoyant les
// informations nécessaires dans le corps de la requête (POST)
router.post('/users', UsersController.postNew);

// Routes pour l'authentification des utilisateurs
// Ces routes gèrent les connexions et les déconnexions des utilisateurs

// Route pour connecter un utilisateur
// Cette route initié le processus de connexion de l'utilisateur
router.get('/connect', AuthController.getConnect);

// Route pour déconnecter un utilisateur
// Cette route termine la session de l'utilisateur et le déconnecte de l'application
router.get('/disconnect', AuthController.getDisconnect);

// Route pour obtenir les informations de l'utilisateur actuellement connecté
// Cette route nécessite une authentification et renvoie les détails de l'utilisateur connecté
router.get('/users/me', AuthController.getMe);

// Routes pour la gestion des fichiers
// Ces routes permettent de gérer les fichiers dans l'application

// Route pour télécharger un nouveau fichier
// Cette route permet aux utilisateurs de télécharger des fichiers
// en envoyant le fichier dans le corps de la requête (POST)
router.post('/files', FilesController.postUpload);

// Route pour obtenir les détails d'un fichier spécifique
// Cette route renvoie les informations d'un fichier en fonction de son ID
router.get('/files/:id', FilesController.getShow);

// Route pour obtenir la liste de tous les fichiers
// Cette route renvoie la liste complète des fichiers disponibles
router.get('/files', FilesController.getIndex);

// Route pour publier un fichier spécifique
// Cette route permet de marquer un fichier comme publié en utilisant son ID
router.put('/files/:id/publish', FilesController.putPublish);

// Route pour retirer la publication d'un fichier spécifique
// Cette route permet de marquer un fichier comme non publié en utilisant son ID
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// Route pour obtenir les données d'un fichier spécifique
// Cette route renvoie le contenu du fichier en fonction de son ID
router.get('/files/:id/data', FilesController.getFile);

module.exports = router;
