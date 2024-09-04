// said
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app'); // Importez l'application Express

describe('FilesController Tests', function() {

  // Test de l'ajout de fichier
  it('POST /files should upload a new file', function(done) {
    request(app)
      .post('/files')
      .attach('file', 'tests/fixtures/testfile.txt') // Assurez-vous que le fichier existe dans ce chemin
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient les informations du fichier téléchargé
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('filename', 'testfile.txt');
        done();
      });
  });

  // Test de la récupération des fichiers avec pagination
  it('GET /files should return a paginated list of files', function(done) {
    request(app)
      .get('/files')
      .query({ page: 1, limit: 10 }) // Paramètres de pagination
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient une liste de fichiers et des métadonnées de pagination
        expect(res.body).to.have.property('files').that.is.an('array');
        expect(res.body).to.have.property('page').that.equals(1);
        expect(res.body).to.have.property('limit').that.equals(10);
        done();
      });
  });

  // Test de la publication d'un fichier
  it('PUT /files/:id/publish should publish a file', function(done) {
    const fileId = 'your_file_id_here'; // Remplacez par un ID de fichier valide
    request(app)
      .put(`/files/${fileId}/publish`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse confirme que le fichier a été publié
        expect(res.body).to.have.property('message', 'File published successfully');
        done();
      });
  });

  // Test de la dépublication d'un fichier
  it('PUT /files/:id/unpublish should unpublish a file', function(done) {
    const fileId = 'your_file_id_here'; // Remplacez par un ID de fichier valide
    request(app)
      .put(`/files/${fileId}/unpublish`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse confirme que le fichier a été dépublié
        expect(res.body).to.have.property('message', 'File unpublished successfully');
        done();
      });
  });

  // Test de la récupération des données d'un fichier
  it('GET /files/:id/data should return the data of a file', function(done) {
    const fileId = 'your_file_id_here'; // Remplacez par un ID de fichier valide
    request(app)
      .get(`/files/${fileId}/data`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse contient les données du fichier
        expect(res.body).to.have.property('data');
        done();
      });
  });

  // Test de la suppression d'un fichier
  it('DELETE /files/:id should delete a file', function(done) {
    const fileId = 'your_file_id_here'; // Remplacez par un ID de fichier valide
    request(app)
      .delete(`/files/${fileId}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        // Vérifiez que la réponse confirme que le fichier a été supprimé
        expect(res.body).to.have.property('message', 'File deleted successfully');
        done();
      });
  });

});

