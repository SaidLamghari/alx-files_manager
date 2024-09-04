// said
const mongoose = require('mongoose');
const redis = require('redis');
const { expect } = require('chai');
// Assurez-vous que le chemin vers votre serveur est correct
const app = require('../server'); 

// Configuration globale des tests
before(async function() {
  // Connexion à la base de données MongoDB de test
  await mongoose.connect('mongodb://localhost:27017/test_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Connexion au serveur Redis de test
  global.redisClient = redis.createClient({ url: 'redis://localhost:6379' });
  await global.redisClient.connect();
});

// Nettoyage après chaque test
afterEach(async function() {
  // Nettoyage de la base de données MongoDB après chaque test
  await mongoose.connection.db.dropDatabase();
  
  // Nettoyage des données Redis après chaque test
  await global.redisClient.flushDb();
});

// Déconnexion et fermeture des connexions après les tests
after(async function() {
  // Déconnexion de MongoDB
  await mongoose.disconnect();
  
  // Déconnexion de Redis
  await global.redisClient.quit();
});

