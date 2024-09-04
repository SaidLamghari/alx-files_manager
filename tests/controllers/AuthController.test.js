// said
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app'); // Importez l'application Express

describe('AuthController Tests', function() {

  // Test de l'inscription
  it('POST /auth/register should register a new user', function(done) {
    request(app)
      .post('/auth/register')
      .send({ username: 'newuser', email: 'newuser@example.com', password: 'password123' })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient les informations de l'utilisateur inscrit
        expect(res.body).to.have.property('username', 'newuser');
        expect(res.body).to.have.property('email', 'newuser@example.com');
        done();
      });
  });

  // Test de la connexion
  it('POST /auth/login should login a user', function(done) {
    request(app)
      .post('/auth/login')
      .send({ email: 'newuser@example.com', password: 'password123' })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient un token d'authentification
        expect(res.body).to.have.property('token');
        done();
      });
  });

  // Test de la connexion échouée
  it('POST /auth/login should fail with incorrect credentials', function(done) {
    request(app)
      .post('/auth/login')
      .send({ email: 'newuser@example.com', password: 'wrongpassword' })
      .expect(401)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse indique une erreur d'authentification
        expect(res.body).to.have.property('error', 'Invalid credentials');
        done();
      });
  });

  // Test de la déconnexion
  it('POST /auth/logout should logout a user', function(done) {
    // Supposons que vous avez un moyen d'obtenir un token valide
    const token = 'your_valid_token_here';  // Remplacez par un token valide
    request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse confirme la déconnexion
        expect(res.body).to.have.property('message', 'Logged out successfully');
        done();
      });
  });

  // Test de la récupération des informations de l'utilisateur connecté
  it('GET /auth/me should return the current user', function(done) {
    // Supposons que vous avez un moyen d'obtenir un token valide
    const token = 'your_valid_token_here';  // Remplacez par un token valide
    request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient les informations de l'utilisateur
        expect(res.body).to.have.property('username');
        expect(res.body).to.have.property('email');
        done();
      });
  });

});
