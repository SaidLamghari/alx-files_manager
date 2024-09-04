// said
// Importation pour générer des vignettes d'image
import imageThumbnail from 'image-thumbnail';
// Importation des promesses de fs pour les opérations sur les fichiers
import { promises as fs } from 'fs';
// Importation de ObjectID pour manipuler les identifiants MongoDB
import { ObjectID } from 'mongodb';
// Importation de Bull pour gérer les files d'attente
import Queue from 'bull';
// Importation du client MongoDB depuis utils/db
import dbClient from './utils/db';

// Création d'une file d'attente Bull pour les fichiers avec une connexion Redis
const flQe = new Queue('fileQueue', 'redis://127.0.0.1:6379');

// Création d'une file d'attente Bull pour les utilisateurs avec une connexion Redis
const usrQue = new Queue('userQueue', 'redis://127.0.0.1:6379');

// Fonction pour générer une vignette d'image avec une largeur spécifiée
async function thumbNail(valwth, vallcpth) {
  // Génère une vignette de l'image au chemin local avec la largeur spécifiée
  const thumbnail = await imageThumbnail(vallcpth, { valwth });
  return thumbnail; // Retourne la vignette générée
}

// Traitement des tâches dans la file d'attente 'fileQueue'
flQe.process(async (job, done) => {
  // Affiche un message indiquant que le traitement commence
  console.log('Processing...');

  // Récupère l'ID du fichier depuis les données du job
  const { fileId } = job.data;
  if (!fileId) {
    // Renvoie une erreur si l'ID du fichier est manquant
    done(new Error('Missing fileId'));
    return; // Terminer le traitement de cette tâche
  }

  // Récupère l'ID de l'utilisateur depuis les données du job
  const { userId } = job.data;
  if (!userId) {
    // Renvoie une erreur si l'ID de l'utilisateur est manquant
    done(new Error('Missing userId'));
    return; // Terminer le traitement de cette tâche
  }

  // Affiche les IDs du fichier et de l'utilisateur pour le débogage
  console.log(fileId, userId);

  // Accède à la collection 'files' dans MongoDB
  const fls = dbClient.db.collection('files');
  // Convertit l'ID du fichier en ObjectID pour la recherche dans MongoDB
  const vlifObj = new ObjectID(fileId);

  // Recherche le fichier dans la base de données
  fls.findOne({ _id: vlifObj }, async (err, file) => {
    if (!file) {
      // Affiche un message d'erreur et termine le job si le fichier n'est pas trouvé
      console.log('Not found');
      done(new Error('File not found'));
      return;
    }

    // Récupère le chemin local du fichier
    const flNme = file.vallcpth;

    // Génère des vignettes avec différentes largeurs
    const thmbnl1 = await thumbNail(100, flNme);
    const thmbnl5 = await thumbNail(500, flNme);
    const thmbnl2 = await thumbNail(250, flNme);

    // Affiche un message indiquant que les fichiers sont en cours d'écriture
    console.log('Writing files to system');

    // Détermine les chemins de sortie pour les vignettes
    const img1 = `${file.vallcpth}_100`;
    const img5 = `${file.vallcpth}_500`;
    const img2 = `${file.vallcpth}_250`;

    // Écrit les vignettes dans le système de fichiers
    await fs.writeFile(img5, thmbnl5);

    await fs.writeFile(img2, thmbnl2);

    await fs.writeFile(img1, thmbnl1);

    // Marque le job comme terminé
    done();
  });
});

// Traitement des tâches dans la file d'attente 'userQueue'
usrQue.process(async (job, done) => {
  // Récupère l'ID de l'utilisateur depuis les données du job
  const { userId } = job.data;
  if (!userId) {
    // Renvoie une erreur si l'ID de l'utilisateur est manquant
    done(new Error('Missing userId'));
    return; // Terminer le traitement de cette tâche
  }

  // Accède à la collection 'users' dans MongoDB
  const users = dbClient.db.collection('users');
  // Convertit l'ID de l'utilisateur en ObjectID pour la recherche dans MongoDB
  const vlifObj = new ObjectID(userId);

  // Recherche l'utilisateur dans la base de données
  const user = await users.findOne({ _id: vlifObj });

  if (user) {
    // Affiche un message de bienvenue si l'utilisateur est trouvé
    console.log(`Welcome ${user.email}!`);
  } else {
    // Renvoie une erreur si l'utilisateur n'est pas trouvé
    done(new Error('User not found'));
  }
});
