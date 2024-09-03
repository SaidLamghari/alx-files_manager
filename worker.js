import Queue from 'bull'; // Importation de Bull pour la gestion des queues
import imageThumbnail from 'image-thumbnail'; // Importation de la bibliothèque pour créer des miniatures d'images
import { promises as fs } from 'fs'; // Importation des fonctions promises de fs pour gérer les fichiers
import { ObjectID } from 'mongodb'; // Importation d'ObjectID pour travailler avec les identifiants MongoDB
import dbClient from './utils/db'; // Importation du client MongoDB depuis le module utils/db

// Création des queues pour les tâches de fichiers et les tâches d'utilisateurs
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

/**
 * Crée une miniature de l'image avec une largeur spécifiée.
 * @param {number} width - La largeur de la miniature.
 * @param {string} localPath - Le chemin local du fichier image.
 * @returns {Buffer} Le buffer contenant l'image miniature.
 */
const thumbNail = async (width, localPath) => {
  try {
    // Génération de la miniature avec la largeur spécifiée
    return await imageThumbnail(localPath, { width });
  } catch (error) {
    console.error('Erreur lors de la création de la miniature :', error); // Journalisation de l'erreur
    // Lancer une nouvelle erreur pour signaler l'échec
    throw new Error('Échec de la création de la miniature');
  }
};

/**
 * Traite les tâches de la queue de fichiers, notamment la génération de miniatures.
 * @param {Object} job - Le job de queue contenant les données nécessaires pour le traitement.
 */
const processFileQueue = async (job) => {
  console.log('Traitement du job de la queue de fichiers...'); // Journalisation du début du traitement

  const { fileId, userId } = job.data; // Extraction des données du job

  if (!fileId || !userId) {
    throw new Error('fileId ou userId manquant'); // Vérification de la présence des données nécessaires
  }

  try {
    // Accès à la collection des fichiers dans MongoDB
    const files = dbClient.db.collection('files');
    // Recherche du fichier par son ID
    const file = await files.findOne({ _id: new ObjectID(fileId) });

    if (!file) {
      throw new Error('Fichier non trouvé'); // Erreur si le fichier n'existe pas
    }

    const { localPath } = file; // Récupération du chemin local du fichier
    console.log('Génération des miniatures...'); // Journalisation du début de la génération des miniatures

    // Création des miniatures avec différentes largeurs
    const thumbnail500 = await thumbNail(500, localPath);
    const thumbnail250 = await thumbNail(250, localPath);
    const thumbnail100 = await thumbNail(100, localPath);

    // Journalisation du début de l'écriture des miniatures
    console.log('Écriture des miniatures sur le disque...');

    // Écriture des miniatures sur le disque
    await Promise.all([
      fs.writeFile(`${localPath}_500`, thumbnail500),
      fs.writeFile(`${localPath}_250`, thumbnail250),
      fs.writeFile(`${localPath}_100`, thumbnail100),
    ]);

    console.log('Miniatures écrites avec succès'); // Journalisation de la réussite de l'écriture
  } catch (error) {
    // Journalisation de l'erreur
    console.error('Erreur lors du traitement du job de la queue de fichiers :', error);
    throw error; // Relancer l'erreur pour signaler l'échec du traitement
  }
};

/**
 * Traite les tâches de la queue d'utilisateurs, notamment l'envoi d'un message de bienvenue.
 * @param {Object} job - Le job de queue contenant les données nécessaires pour le traitement.
 */
const processUserQueue = async (job) => {
  // Journalisation du début du traitement
  console.log('Traitement du job de la queue d\'utilisateurs...');

  const { userId } = job.data; // Extraction des données du job

  if (!userId) {
    throw new Error('userId manquant'); // Vérification de la présence des données nécessaires
  }

  try {
    const users = dbClient.db.collection('users'); // Accès à la collection des utilisateurs dans MongoDB
    // Recherche de l'utilisateur par son ID
    const user = await users.findOne({ _id: new ObjectID(userId) });

    if (user) {
      // Journalisation du message de bienvenue avec l'email de l'utilisateur
      console.log(`Bienvenue ${user.email} !`);
    } else {
      throw new Error('Utilisateur non trouvé'); // Erreur si l'utilisateur n'existe pas
    }
  } catch (error) {
    // Journalisation de l'erreur
    console.error('Erreur lors du traitement du job de la queue d\'utilisateurs :', error);
    throw error; // Relancer l'erreur pour signaler l'échec du traitement
  }
};

// Configuration des processus de traitement des queues
fileQueue.process(processFileQueue); // Traitement des tâches de la queue de fichiers
userQueue.process(processUserQueue); // Traitement des tâches de la queue d'utilisateurs
