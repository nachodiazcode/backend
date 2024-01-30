'use strict'

const express = require('express');
const userController = require('../controllers/user');

let api = express.Router();

const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/users'});

const md_auth = require('../middlewares/authenticated');
const publication = require('../models/publication');

api.get('/home', md_auth.ensureAuth, userController.home);

api.post('/register', userController.saveUser); 
api.post('/login', userController.loginUser); 
api.get('/user/:id', md_auth.ensureAuth, userController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, userController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, userController.getCounters );
api.put('/update-user/:id', md_auth.ensureAuth, userController.updateUser);

api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], userController.uploadImage);
api.get('/get-image-user/:imageFile', userController.getImageFile);


module.exports = api ;