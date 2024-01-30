'use strict'

const express = require('express');
const publicationController = require('../controllers/publication');

const api = express.Router();
const md_auth = require('../middlewares/authenticated');

const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/publications'});

api.post('/publication', md_auth.ensureAuth, publicationController.savePublication);
api.get('/publications/:page?', md_auth.ensureAuth, publicationController.getPublications);
api.get('/publications-user/:user/:page?', md_auth.ensureAuth, publicationController.getPublicationsUser);

api.get('/publication/:id', md_auth.ensureAuth, publicationController.getPublication);

api.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload], publicationController.uploadImage);
api.get('/get-image-pub/:imageFile', publicationController.getImageFile);

api.delete('/publication/:id', md_auth.ensureAuth, publicationController.deletePublication);

module.exports = api ;