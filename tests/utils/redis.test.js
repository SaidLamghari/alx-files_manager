// said
const Redis = require('ioredis');
const { expect } = require('chai');

// Créez une instance de Redis pour les tests
const redis = new Redis({
  port: 6379,  // Port par défaut de Redis
  host: 'localhost',  // Adresse de Redis
  // Il est possible d'ajouter d'autres options si nécessaire, comme un mot de passe
});

// Définir des clés et valeurs de test
const testKey = 'test_key';
const testValue = 'test_value';

describe('Redis Tests', function() {
  before(async function() {
    // Cette fonction sera appelée avant tous les tests pour préparer l'environnement
    // Par exemple, vérifier la connexion à Redis ou réinitialiser l'état
    await redis.set(testKey, testValue);  // Préparation d'une valeur de test
  });

  afterEach(async function() {
    // Cette fonction sera appelée après chaque test pour nettoyer l'état
    await redis.del(testKey);  // Suppression de la clé de test après chaque test
  });

  after(async function() {
    // Cette fonction sera appelée après tous les tests pour fermer la connexion Redis
    redis.disconnect();
  });

  it('should set and get a value', async function() {
    // Définir une valeur dans Redis
    await redis.set(testKey, testValue);
    
    // Récupérer la valeur depuis Redis
    const value = await redis.get(testKey);
    
    // Vérifier que la valeur récupérée est correcte
    expect(value).to.equal(testValue);
  });

  it('should delete a key', async function() {
    // Définir une valeur dans Redis
    await redis.set(testKey, testValue);
    
    // Supprimer la clé
    await redis.del(testKey);
    
    // Essayer de récupérer la clé supprimée
    const value = await redis.get(testKey);
    
    // Vérifier que la clé a été supprimée
    expect(value).to.be.null;
  });

  it('should handle non-existent keys', async function() {
    // Essayer de récupérer une clé qui n'existe pas
    const value = await redis.get('non_existent_key');
    
    // Vérifier que la clé n'existe pas
    expect(value).to.be.null;
  });
});

