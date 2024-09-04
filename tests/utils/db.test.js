// said
const mongoose = require('mongoose');
const { expect } = require('chai');
// Assurez-vous que le chemin vers votre modèle User est correct
const { User } = require('../../models/user');

// Définir des données de test
const testUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'password123'
};

describe('Database Tests', function() {
  before(async function() {
    // Connexion à la base de données MongoDB de test
    await mongoose.connect('mongodb://localhost:27017/test_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterEach(async function() {
    // Nettoyage de la collection User après chaque test
    await User.deleteMany({});
  });

  after(async function() {
    // Déconnexion de la base de données
    await mongoose.disconnect();
  });

  it('should create a new user', async function() {
    // Création d'un utilisateur
    const user = new User(testUser);
    await user.save();
    
    // Vérification que l'utilisateur est correctement enregistré
    const foundUser = await User.findOne({ email: testUser.email });
    expect(foundUser).to.not.be.null;
    expect(foundUser.name).to.equal(testUser.name);
  });

  it('should retrieve an existing user', async function() {
    // Création et sauvegarde d'un utilisateur
    const user = new User(testUser);
    await user.save();
    
    // Récupération de l'utilisateur
    const foundUser = await User.findOne({ email: testUser.email });
    expect(foundUser).to.not.be.null;
    expect(foundUser.email).to.equal(testUser.email);
  });

  it('should update an existing user', async function() {
    // Création et sauvegarde d'un utilisateur
    const user = new User(testUser);
    await user.save();
    
    // Mise à jour de l'utilisateur
    await User.updateOne({ email: testUser.email }, { name: 'Jane Doe' });
    const updatedUser = await User.findOne({ email: testUser.email });
    expect(updatedUser.name).to.equal('Jane Doe');
  });

  it('should delete an existing user', async function() {
    // Création et sauvegarde d'un utilisateur
    const user = new User(testUser);
    await user.save();
    
    // Suppression de l'utilisateur
    await User.deleteOne({ email: testUser.email });
    const deletedUser = await User.findOne({ email: testUser.email });
    expect(deletedUser).to.be.null;
  });
});

