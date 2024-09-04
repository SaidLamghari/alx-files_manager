// said
// Importation de la fonction uuidv4 pour générer des identifiants uniques
import { v4 as uuidv4 } from 'uuid';
// Importation des promesses de fs pour gérer les opérations de fichiers
import { promises as fs } from 'fs';
// Importation de Bull pour gérer les files d'attente
import Queue from 'bull';
// Importation du client MongoDB depuis le fichier utils/db
import { ObjectID } from 'mongodb';
import mime from 'mime-types';
import dbClient from '../utils/db';
// Importation du client Redis depuis le fichier utils/redis
import redisClient from '../utils/redis';
// Importation de ObjectID pour manipuler les identifiants MongoDB
// Importation pour déterminer le type MIME des fichiers

// Création d'une file d'attente Bull pour les fichiers avec une connexion Redis
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  // Méthode pour obtenir l'utilisateur à partir du token d'authentification
  static async getUser(request) {
    // Récupère le token depuis l'en-tête 'X-Token'
    const token = request.header('X-Token');
    // Crée la clé Redis associée au token
    const key = `auth_${token}`;
    // Récupère l'ID utilisateur depuis Redis
    const userId = await redisClient.get(key);

    if (userId) {
      // Accède à la collection 'users' dans MongoDB
      const users = dbClient.db.collection('users');
      // Convertit l'ID utilisateur en ObjectID
      const vidObjct = new ObjectID(userId);
      // Recherche l'utilisateur dans la base de données
      const user = await users.findOne({ _id: vidObjct });
      if (!user) {
        // Retourne null si l'utilisateur n'est pas trouvé
        return null;
      }
      // Retourne l'utilisateur si trouvé
      return user;
    }
    // Retourne null si l'ID utilisateur n'est pas trouvé dans Redis
    return null;
  }

  // Méthode pour télécharger un fichier
  static async postUpload(request, response) {
    // Obtient l'utilisateur à partir du token
    const user = await FilesController.getUser(request);
    if (!user) {
      // Renvoie une erreur 401 si l'utilisateur n'est pas authentifié
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Récupère les données du corps de la requête
    const {
      name, type, parentId, isPublic = false, data,
    } = request.body;

    if (!name) {
      // Renvoie une erreur 400 si le nom est manquant
      return response.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      // Renvoie une erreur 400 si le type est manquant
      return response.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      // Renvoie une erreur 400 si les données sont manquantes pour un fichier
      return response.status(400).json({ error: 'Missing data' });
    }

    // Accède à la collection 'files' dans MongoDB
    const files = dbClient.db.collection('files');

    if (parentId) {
      // Convertit l'ID parent en ObjectID
      const vidObjct = new ObjectID(parentId);
      // Recherche le fichier parent dans la base de données
      const file = await files.findOne({ _id: vidObjct, userId: user._id });
      if (!file) {
        // Renvoie une erreur 400 si le parent n'est pas trouvé
        return response.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        // Renvoie une erreur 400 si le parent n'est pas un dossier
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      // Insertion d'un dossier dans la collection 'files'
      files.insertOne({
        userId: user._id,
        name,
        type,
        parentId: parentId || 0,
        isPublic,
      }).then((result) => {
        // Renvoie une réponse avec le statut 201 et les détails du dossier
        response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
      }).catch((error) => {
        // Log les erreurs
        console.log(error);
      });
    } else {
      // Traitement pour les fichiers
      // Définition du chemin pour stocker les fichiers
      const vflPth = process.env.FOLDER_PATH || '/tmp/files_manager';
      // Création d'un nom de fichier unique
      const flNme = `${vflPth}/${uuidv4()}`;
      // Conversion des données en buffer à partir de base64
      const buff = Buffer.from(data, 'base64');

      try {
        // Essaye de créer le répertoire si nécessaire
        try {
          await fs.mkdir(vflPth);
        } catch (error) {
          // Passe en cas d'erreur (le répertoire existe probablement déjà)
        }
        // Écrit le fichier en utilisant les données
        await fs.writeFile(flNme, buff, 'utf-8');
      } catch (error) {
        // Log les erreurs
        console.log(error);
      }

      // Insertion du fichier dans la collection 'files'
      files.insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
        localPath: flNme, // Chemin local du fichier
      }).then((result) => {
        // Renvoie une réponse avec le statut 201 et les détails du fichier
        response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
        if (type === 'image') {
          // Ajoute une tâche à la file d'attente si le type est 'image'
          fileQueue.add({
            userId: user._id,
            fileId: result.insertedId,
          });
        }
      }).catch((error) => console.log(error)); // Log les erreurs
    }
    // Retourne null pour terminer la méthode
    return null;
  }

  // Méthode pour afficher les détails d'un fichier spécifique
  static async getShow(request, response) {
    // Obtient l'utilisateur à partir du token
    const user = await FilesController.getUser(request);
    if (!user) {
      // Renvoie une erreur 401 si l'utilisateur n'est pas authentifié
      return response.status(401).json({ error: 'Unauthorized' });
    }
    // Récupère l'ID du fichier depuis les paramètres de la requête
    const fileId = request.params.id;
    // Accède à la collection 'files' dans MongoDB
    const files = dbClient.db.collection('files');
    // Convertit l'ID du fichier en ObjectID
    const vidObjct = new ObjectID(fileId);
    // Recherche le fichier dans la base de données
    const file = await files.findOne({ _id: vidObjct, userId: user._id });
    if (!file) {
      // Renvoie une erreur 404 si le fichier n'est pas trouvé
      return response.status(404).json({ error: 'Not found' });
    }
    // Renvoie les détails du fichier avec le statut 200
    return response.status(200).json(file);
  }

  // Méthode pour lister les fichiers d'un utilisateur
  static async getIndex(request, response) {
    // Obtient l'utilisateur à partir du token
    const user = await FilesController.getUser(request);
    if (!user) {
      // Renvoie une erreur 401 si l'utilisateur n'est pas authentifié
      return response.status(401).json({ error: 'Unauthorized' });
    }
    // Récupère les paramètres de la requête
    const { parentId, page } = request.query;
    // Définit le numéro de page (0 par défaut)
    const pageNum = page || 0;
    // Accède à la collection 'files' dans MongoDB
    const files = dbClient.db.collection('files');
    let query;
    if (!parentId) {
      // Si aucun parentId n'est spécifié, recherche tous les fichiers de l'utilisateur
      query = { userId: user._id };
    } else {
      // Sinon, recherche les fichiers avec le parentId spécifié
      query = { userId: user._id, parentId: ObjectID(parentId) };
    }
    // Exécution d'une agrégation pour obtenir les fichiers avec pagination
    files.aggregate([
      { $match: query }, // Filtrage des fichiers selon la requête
      { $sort: { _id: -1 } }, // Tri des fichiers par ID décroissant
      {
        $facet: {
          metadata: [
            // Exécution d'une autre agrégation pour obtenir le nombre total de fichiers
            { $count: 'total' },
            { $addFields: { page: parseInt(pageNum, 10) } },
          ],
          data: [
            // Pagination des fichiers (20 fichiers par page)
            { $skip: 20 * parseInt(pageNum, 10) },
            { $limit: 20 },
          ],
        },
      },
    ]).toArray((err, result) => {
      if (result) {
        // Transformation des fichiers pour supprimer les champs inutiles
        const final = result[0].data.map((file) => {
          const tmpFile = {
            ...file,
            id: file._id,
          };
          delete tmpFile._id; // Supprime l'ID interne
          delete tmpFile.localPath; // Supprime le chemin local
          return tmpFile;
        });
        // Renvoie les fichiers avec le statut 200
        return response.status(200).json(final);
      }
      // Log les erreurs
      console.log('Error occured');
      // Renvoie une erreur 404 si les fichiers ne sont pas trouvés
      return response.status(404).json({ error: 'Not found' });
    });
    // Retourne null pour terminer la méthode
    return null;
  }

  // Méthode pour rendre un fichier public
  static async putPublish(request, response) {
    // Obtient l'utilisateur à partir du token
    const user = await FilesController.getUser(request);
    if (!user) {
      // Renvoie une erreur 401 si l'utilisateur n'est pas authentifié
      return response.status(401).json({ error: 'Unauthorized' });
    }
    // Récupère l'ID du fichier depuis les paramètres de la requête
    const { id } = request.params;
    // Accède à la collection 'files' dans MongoDB
    const files = dbClient.db.collection('files');
    // Convertit l'ID du fichier en ObjectID
    const vidObjct = new ObjectID(id);
    // Définition de la mise à jour (rendre le fichier public)
    const nwVle = { $set: { isPublic: true } };
    // Options pour retourner le fichier mis à jour
    const options = { returnOriginal: false };
    // Mise à jour du fichier pour le rendre public
    files.findOneAndUpdate({ _id: vidObjct, userId: user._id }, nwVle, options, (err, file) => {
      if (!file.lastErrorObject.updatedExisting) {
        // Renvoie une erreur 404 si le fichier n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }
      // Renvoie le fichier mis à jour avec le statut 200
      return response.status(200).json(file.value);
    });
    // Retourne null pour terminer la méthode
    return null;
  }

  // Méthode pour rendre un fichier privé
  static async putUnpublish(request, response) {
    // Obtient l'utilisateur à partir du token
    const user = await FilesController.getUser(request);
    if (!user) {
      // Renvoie une erreur 401 si l'utilisateur n'est pas authentifié
      return response.status(401).json({ error: 'Unauthorized' });
    }
    // Récupère l'ID du fichier depuis les paramètres de la requête
    const { id } = request.params;
    // Accède à la collection 'files' dans MongoDB
    const files = dbClient.db.collection('files');
    // Convertit l'ID du fichier en ObjectID
    const vidObjct = new ObjectID(id);
    // Définition de la mise à jour (rendre le fichier privé)
    const nwVle = { $set: { isPublic: false } };
    // Options pour retourner le fichier mis à jour
    const options = { returnOriginal: false };
    // Mise à jour du fichier pour le rendre privé
    files.findOneAndUpdate({ _id: vidObjct, userId: user._id }, nwVle, options, (err, file) => {
      if (!file.lastErrorObject.updatedExisting) {
        // Renvoie une erreur 404 si le fichier n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }
      // Renvoie le fichier mis à jour avec le statut 200
      return response.status(200).json(file.value);
    });
    // Retourne null pour terminer la méthode
    return null;
  }

  // Méthode pour obtenir le contenu d'un fichier
  static async getFile(request, response) {
    // Récupère l'ID du fichier depuis les paramètres de la requête
    const { id } = request.params;
    // Accède à la collection 'files' dans MongoDB
    const files = dbClient.db.collection('files');
    // Convertit l'ID du fichier en ObjectID
    const vidObjct = new ObjectID(id);
    // Recherche le fichier dans la base de données
    files.findOne({ _id: vidObjct }, async (err, file) => {
      if (!file) {
        // Renvoie une erreur 404 si le fichier n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }
      // Log le chemin local du fichier
      console.log(file.localPath);
      if (file.isPublic) {
        // Si le fichier est public
        if (file.type === 'folder') {
          // Renvoie une erreur 400 si le fichier est un dossier
          return response.status(400).json({ error: "A folder doesn't have content" });
        }
        try {
          // Détermine le nom du fichier à lire
          let flNme = file.localPath;
          const size = request.param('size');
          if (size) {
            flNme = `${file.localPath}_${size}`; // Ajoute la taille au nom du fichier si spécifiée
          }
          // Lit le fichier depuis le système de fichiers
          const data = await fs.readFile(flNme);
          // Détermine le type MIME du fichier
          const conttType = mime.contentType(file.name);
          // Renvoie le fichier avec le type MIME approprié
          return response.header('Content-Type', conttType).status(200).send(data);
        } catch (error) {
          // Log les erreurs
          console.log(error);
          // Renvoie une erreur 404 si le fichier ne peut pas être lu
          return response.status(404).json({ error: 'Not found' });
        }
      } else {
        // Si le fichier n'est pas public
        const user = await FilesController.getUser(request);
        if (!user) {
          // Renvoie une erreur 404 si l'utilisateur n'est pas authentifié
          return response.status(404).json({ error: 'Not found' });
        }
        if (file.userId.toString() === user._id.toString()) {
          // Vérifie si l'utilisateur est le propriétaire du fichier
          if (file.type === 'folder') {
            // Renvoie une erreur 400 si le fichier est un dossier
            return response.status(400).json({ error: "A folder doesn't have content" });
          }
          try {
            // Détermine le nom du fichier à lire
            let flNme = file.localPath;
            const size = request.param('size');
            if (size) {
              // Ajoute la taille au nom du fichier si spécifiée
              flNme = `${file.localPath}_${size}`;
            }
            // Détermine le type MIME du fichier
            const conttType = mime.contentType(file.name);
            // Renvoie le fichier avec le type MIME approprié
            return response.header('Content-Type', conttType).status(200).sendFile(flNme);
          } catch (error) {
            // Log les erreurs
            console.log(error);
            // Renvoie une erreur 404 si le fichier ne peut pas être lu
            return response.status(404).json({ error: 'Not found' });
          }
        } else {
          // Log les erreurs de correspondance d'utilisateur
          console.log(`Wrong user: file.userId=${file.userId}; userId=${user._id}`);
          // Renvoie une erreur 404 si l'utilisateur ne correspond pas
          return response.status(404).json({ error: 'Not found' });
        }
      }
    });
  }
}

// Exporte la classe FilesController pour qu'elle puisse
// être utilisée dans d'autres parties de l'application
module.exports = FilesController;
