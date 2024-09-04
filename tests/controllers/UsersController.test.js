// said
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app'); // Importez l'application Express

describe('UsersController Tests', function() {

  // Test de la création d'un utilisateur
  it('POST /users should create a new user', function(done) {
    request(app)
      .post('/users')
      .send({
        username: 'testuser',
        password: 'testpassword',
        email: 'testuser@example.com'
      })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient les informations de l'utilisateur créé
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('username', 'testuser');
        expect(res.body).to.have.property('email', 'testuser@example.com');
        done();
      });
  });

  // Test de la récupération des informations de l'utilisateur actuel
  it('GET /users/me should return the current user information', function(done) {
    // Connexion d'un utilisateur avant de récupérer les informations
    request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        // Utiliser le token d'authentification pour récupérer les informations de l'utilisateur
        request(app)
          .get('/users/me')
          .set('Authorization', `Bearer ${res.body.token}`)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            // Vérifiez que la réponse contient les informations de l'utilisateur actuel
            expect(res.body).to.have.property('username', 'testuser');
            expect(res.body).to.have.property('email', 'testuser@example.com');
            done();
          });
      });
  });

  // Test de la mise à jour des informations d'un utilisateur
  it('PUT /users/:id should update user information', function(done) {
    const userId = 'your_user_id_here'; // Remplacez par un ID d'utilisateur valide
    request(app)
      .put(`/users/${userId}`)
      .send({
        username: 'updateduser',
        email: 'updateduser@example.com'
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse confirme que les informations de l'utilisateur ont été mises à jour
        expect(res.body).to.have.property('username', 'updateduser');
        expect(res.body).to.have.property('email', 'updateduser@example.com');
        done();
      });
  });

  // Test de la connexion d'un utilisateur
  it('POST /login should log in a user and return a token', function(done) {
    request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient un token d'authentification
        expect(res.body).to.have.property('token');
        done();
      });
  });

  // Test de la déconnexion d'un utilisateur
  it('POST /logout should log out a user', function(done) {
    // Connexion d'un utilisateur avant de se déconnecter
    request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        // Utiliser le token d'authentification pour se déconnecter
        request(app)
          .post('/logout')
          .set('Authorization', `Bearer ${res.body.token}`)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            // Vérifiez que la réponse confirme que l'utilisateur a été déconnecté
            expect(res.body).to.have.property('message', 'User logged out successfully');
            done();
          });
      });
  });

});

