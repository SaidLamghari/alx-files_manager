import { v4 as uuidv4 } from 'uuid'; // Génération d'UUID pour les noms de fichiers uniques
import { promises as fs } from 'fs'; // Importation des fonctions promises de fs pour la gestion des fichiers
import { ObjectID } from 'mongodb'; // Importation d'ObjectID pour travailler avec les identifiants MongoDB
import mime from 'mime-types'; // Détermination des types MIME pour les fichiers
import Queue from 'bull'; // Gestion des files d'attente pour les tâches asynchrones
import dbClient from '../utils/db'; // Client de base de données MongoDB
import redisClient from '../utils/redis'; // Client Redis pour la gestion des sessions utilisateur

// Création de la file d'attente pour les tâches liées aux fichiers
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  /**
   * Récupère les informations de l'utilisateur à partir du token d'authentification.
   * @param {Object} request - La requête HTTP contenant les informations de la requête.
   * @returns {Object|null} L'utilisateur trouvé ou null si non autorisé.
   */
  static async getUser(request) {
    const token = request.header('X-Token'); // Récupération du token depuis les en-têtes
    const key = `auth_${token}`; // Construction de la clé Redis
    const userId = await redisClient.get(key); // Récupération de l'ID utilisateur depuis Redis

    if (userId) {
      const users = dbClient.db.collection('users'); // Accès à la collection des utilisateurs
      // Recherche de l'utilisateur dans MongoDB
      return users.findOne({ _id: new ObjectID(userId) });
    }
    return null; // Retourne null si l'utilisateur n'est pas trouvé
  }

  /**
   * Téléverse un nouveau fichier ou dossier et l'enregistre dans la base de données.
   * @param {Object} request - La requête HTTP contenant les données du fichier.
   * @param {Object} response - La réponse HTTP à envoyer.
   * @returns {Object} La réponse HTTP avec les informations du fichier ou une erreur.
   */
  static async postUpload(request, response) {
    const user = await FilesController.getUser(request); // Récupération de l'utilisateur
    if (!user) {
      // Retourne une erreur si l'utilisateur n'est pas autorisé
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Extraction des données du corps de la requête
    const {
      name, type, parentId, data, isPublic = false,
    } = request.body;

    if (!name) {
      return response.status(400).json({ error: 'Missing name' }); // Vérifie si le nom est fourni
    }
    if (!type) {
      // Vérifie si le type est fourni
      return response.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      // Vérifie si les données sont fournies pour les fichiers
      return response.status(400).json({ error: 'Missing data' });
    }

    const files = dbClient.db.collection('files'); // Accès à la collection des fichiers

    try {
      // Vérifie si le parentId est valide et si le parent est un dossier
      if (parentId) {
        const parentFile = await files.findOne({ _id: new ObjectID(parentId), userId: user._id });
        if (!parentFile) {
          // Erreur si le parent n'existe pas
          return response.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          // Erreur si le parent n'est pas un dossier
          return response.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      let result;
      if (type === 'folder') {
        // Ajoute un dossier
        result = await files.insertOne({
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        });
      } else {
        // Ajoute un fichier
        // Répertoire de stockage des fichiers
        const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileName = `${filePath}/${uuidv4()}`; // Nom unique du fichier
        const buffer = Buffer.from(data, 'base64'); // Convertit les données en buffer

        await fs.mkdir(filePath, { recursive: true }); // Crée le répertoire si nécessaire
        await fs.writeFile(fileName, buffer); // Écrit le fichier sur le disque

        result = await files.insertOne({
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: fileName,
        });

        if (type === 'image') {
          // Ajoute une tâche à la file d'attente pour les images
          fileQueue.add({ userId: user._id, fileId: result.insertedId });
        }
      }

      return response.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });
    } catch (error) {
      console.error('Erreur lors du téléversement :', error);
      return response.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  /**
   * Récupère les détails d'un fichier par son ID.
   * @param {Object} request - La requête HTTP contenant l'ID du fichier.
   * @param {Object} response - La réponse HTTP à envoyer.
   * @returns {Object} La réponse HTTP avec les détails du fichier ou une erreur.
   */
  static async getShow(request, response) {
    const user = await FilesController.getUser(request); // Récupération de l'utilisateur
    if (!user) {
      // Retourne une erreur si l'utilisateur n'est pas autorisé
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Récupération de l'ID du fichier depuis les paramètres de la requête
    const fileId = request.params.id;
    const files = dbClient.db.collection('files'); // Accès à la collection des fichiers

    try {
      // Recherche du fichier dans MongoDB
      const file = await files.findOne({ _id: new ObjectID(fileId), userId: user._id });
      if (!file) {
        // Retourne une erreur si le fichier n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }
      return response.status(200).json(file); // Retourne les détails du fichier
    } catch (error) {
      console.error('Erreur lors de la récupération du fichier :', error);
      return response.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  /**
   * Liste tous les fichiers pour un utilisateur donné, avec support de pagination.
   * @param {Object} request - La requête HTTP contenant les paramètres de pagination.
   * @param {Object} response - La réponse HTTP à envoyer.
   * @returns {Object} La réponse HTTP avec la liste des fichiers ou une erreur.
   */
  static async getIndex(request, response) {
    const user = await FilesController.getUser(request); // Récupération de l'utilisateur
    if (!user) {
      // Retourne une erreur si l'utilisateur n'est pas autorisé
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Récupération des paramètres de requête pour la pagination
    const { parentId, page = 0 } = request.query;
    const files = dbClient.db.collection('files'); // Accès à la collection des fichiers

    // Construction de la requête selon la présence ou non de parentId
    const query = !parentId
      ? { userId: user._id }
      : { userId: user._id, parentId: new ObjectID(parentId) };

    try {
      // Exécution de l'agrégation pour récupérer les fichiers avec pagination
      const result = await files.aggregate([
        { $match: query },
        { $sort: { _id: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }, { $addFields: { page: parseInt(page, 10) } }],
            data: [{ $skip: 20 * parseInt(page, 10) }, { $limit: 20 }],
          },
        },
      ]).toArray();

      // Transformation des résultats pour retirer le champ localPath
      const final = result[0].data.map((file) => {
        const { _id, localPath, ...fileData } = file;
        return { id: _id, ...fileData };
      });

      return response.status(200).json(final); // Retourne la liste des fichiers paginés
    } catch (error) {
      console.error('Erreur lors de la liste des fichiers :', error);
      return response.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  /**
   * Publie un fichier, rendant son contenu accessible publiquement.
   * @param {Object} request - La requête HTTP contenant l'ID du fichier.
   * @param {Object} response - La réponse HTTP à envoyer.
   * @returns {Object} La réponse HTTP avec les détails du fichier ou une erreur.
   */
  static async putPublish(request, response) {
    const user = await FilesController.getUser(request); // Récupération de l'utilisateur
    if (!user) {
      // Retourne une erreur si l'utilisateur n'est pas autorisé
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Récupération de l'ID du fichier depuis les paramètres de la requête
    const { id } = request.params;
    const files = dbClient.db.collection('files'); // Accès à la collection des fichiers

    try {
      const file = await files.findOneAndUpdate(
        { _id: new ObjectID(id), userId: user._id },
        { $set: { isPublic: true } }, // Mise à jour de la visibilité du fichier
        { returnOriginal: false }, // Retourne la version mise à jour du fichier
      );

      if (!file.value) {
        // Retourne une erreur si le fichier n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }

      return response.status(200).json(file.value); // Retourne les détails du fichier mis à jour
    } catch (error) {
      console.error('Erreur lors de la publication du fichier :', error);
      return response.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  /**
   * Dépublie un fichier, rendant son contenu privé.
   * @param {Object} request - La requête HTTP contenant l'ID du fichier.
   * @param {Object} response - La réponse HTTP à envoyer.
   * @returns {Object} La réponse HTTP avec les détails du fichier ou une erreur.
   */
  static async putUnpublish(request, response) {
    const user = await FilesController.getUser(request); // Récupération de l'utilisateur
    if (!user) {
      // Retourne une erreur si l'utilisateur n'est pas autorisé
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Récupération de l'ID du fichier depuis les paramètres de la requête
    const { id } = request.params;
    const files = dbClient.db.collection('files'); // Accès à la collection des fichiers

    try {
      const file = await files.findOneAndUpdate(
        { _id: new ObjectID(id), userId: user._id },
        { $set: { isPublic: false } }, // Mise à jour de la visibilité du fichier
        { returnOriginal: false }, // Retourne la version mise à jour du fichier
      );

      if (!file.value) {
        // Retourne une erreur si le fichier n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }

      return response.status(200).json(file.value); // Retourne les détails du fichier mis à jour
    } catch (error) {
      console.error('Erreur lors de la dépublication du fichier :', error);
      return response.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  /**
   * Récupère un fichier par son ID, en vérifiant les autorisations d'accès.
   * @param {Object} request - La requête HTTP contenant l'ID
   * du fichier et les options de requête.
   * @param {Object} response - La réponse HTTP à envoyer.
   * @returns {Object} La réponse HTTP avec le fichier ou une erreur.
   */
  static async getFile(request, response) {
    // Récupération de l'ID du fichier depuis les paramètres de la requête
    const { id } = request.params;
    const files = dbClient.db.collection('files'); // Accès à la collection des fichiers

    try {
      // Recherche du fichier dans MongoDB
      const file = await files.findOne({ _id: new ObjectID(id) });
      if (!file) {
        // Retourne une erreur si le fichier n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }

      if (file.isPublic) {
        if (file.type === 'folder') {
          // Erreur si le fichier est un dossier
          return response.status(400).json({ error: "A folder doesn't have content" });
        }
        // Ajuste le nom du fichier selon la taille demandée
        const fileName = request.query.size ? `${file.localPath}_${request.query.size}` : file.localPath;
        const data = await fs.readFile(fileName); // Lecture des données du fichier
        const contentType = mime.contentType(file.name); // Détermination du type MIME
        // Envoi du fichier
        return response.header('Content-Type', contentType).status(200).send(data);
      }
      const user = await FilesController.getUser(request); // Récupération de l'utilisateur
      if (!user) {
        // Retourne une erreur si l'utilisateur n'est pas trouvé
        return response.status(404).json({ error: 'Not found' });
      }
      if (file.userId.toString() === user._id.toString()) {
        if (file.type === 'folder') {
          // Erreur si le fichier est un dossier
          return response.status(400).json({ error: "A folder doesn't have content" });
        }
        // Ajuste le nom du fichier selon la taille demandée
        const fileName = request.query.size ? `${file.localPath}_${request.query.size}` : file.localPath;
        const contentType = mime.contentType(file.name); // Détermination du type MIME
        // Envoi du fichier
        return response.header('Content-Type', contentType).status(200).sendFile(fileName);
      }
      // Retourne une erreur si le fichier n'appartient pas à l'utilisateur
      return response.status(404).json({ error: 'Not found' });
    } catch (error) {
      console.error('Erreur lors de la récupération du fichier :', error);
      return response.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }
}

export default FilesController;
