// said
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app'); // Importez l'application Express

describe('AppController Tests', function() {

  it('GET /status should return status 200', function(done) {
    request(app)
      .get('/status')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez le corps de la réponse si nécessaire
        expect(res.body).to.deep.equal({ status: 'ok' });
        done();
      });
  });

  it('GET /stats should return statistics', function(done) {
    request(app)
      .get('/stats')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Assurez-vous que la réponse contient des statistiques
        expect(res.body).to.have.property('total_users');
        expect(res.body).to.have.property('total_files');
        done();
      });
  });

  it('POST /users should create a user', function(done) {
    request(app)
      .post('/users')
      .send({ username: 'testuser', email: 'test@example.com' })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient des informations sur l'utilisateur créé
        expect(res.body).to.have.property('username', 'testuser');
        expect(res.body).to.have.property('email', 'test@example.com');
        done();
      });
  });

  it('GET /connect should connect a user', function(done) {
    request(app)
      .get('/connect')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez la réponse pour s'assurer qu'elle indique une connexion réussie
        expect(res.body).to.have.property('connected', true);
        done();
      });
  });

  it('GET /disconnect should disconnect a user', function(done) {
    request(app)
      .get('/disconnect')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez la réponse pour s'assurer qu'elle indique une déconnexion réussie
        expect(res.body).to.have.property('disconnected', true);
        done();
      });
  });

  it('GET /users/me should return the current user', function(done) {
    request(app)
      .get('/users/me')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez la réponse pour vous assurer qu'elle contient les informations de l'utilisateur
        expect(res.body).to.have.property('username');
        expect(res.body).to.have.property('email');
        done();
      });
  });

  it('POST /files should upload a file', function(done) {
    request(app)
      .post('/files')
      .attach('file', 'path/to/your/file.txt')  // Modifiez le chemin du fichier
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient les informations sur le fichier téléchargé
        expect(res.body).to.have.property('file_id');
        done();
      });
  });

  it('GET /files/:id should return a file', function(done) {
    request(app)
      .get('/files/1')  // Modifiez l'ID du fichier si nécessaire
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient les informations du fichier
        expect(res.body).to.have.property('file_id', '1');
        done();
      });
  });

  it('GET /files should return paginated files', function(done) {
    request(app)
      .get('/files')
      .query({ page: 1, limit: 10 })  // Pagination : page et limite
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient des fichiers paginés
        expect(res.body).to.have.property('files');
        expect(res.body.files).to.be.an('array');
        done();
      });
  });

  it('PUT /files/:id/publish should publish a file', function(done) {
    request(app)
      .put('/files/1/publish')  // Modifiez l'ID du fichier si nécessaire
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que le fichier est bien marqué comme publié
        expect(res.body).to.have.property('published', true);
        done();
      });
  });

  it('PUT /files/:id/unpublish should unpublish a file', function(done) {
    request(app)
      .put('/files/1/unpublish')  // Modifiez l'ID du fichier si nécessaire
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que le fichier est bien marqué comme non publié
        expect(res.body).to.have.property('published', false);
        done();
      });
  });

  it('GET /files/:id/data should return file data', function(done) {
    request(app)
      .get('/files/1/data')  // Modifiez l'ID du fichier si nécessaire
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que les données du fichier sont retournées correctement
        expect(res.body).to.have.property('data');
        done();
      });
  });
});

