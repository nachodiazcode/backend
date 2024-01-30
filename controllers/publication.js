'use strict'

const path = require('path');
const fs = require('fs');
const moment = require('moment');
const mongoosePaginate = require('mongoose-pagination');

const Publication = require('../models/publication');
const User = require('../models/user');
const Follow = require('../models/follow');

function savePublication(req, res){

    const params = req.body ;

    if(!params.text) return res.status(200).send({message: "Debes enviar un texto!!"});

    const publication = new Publication();

    publication.text = params.text;
    publication.file = null ;
    publication.user = req.user.sub ;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored)=>{

        if(err) return res.status(500).send({message:"Error al guardar la publicación"});
        if(!publicationStored) return res.status(404).send({message:"La publicación no ha sido guardada"});

        return res.status(200).send({publication: publicationStored});

    })
}

function getPublications(req, res){

    let page = 1 ; 

    if(req.params.page){
        page = req.params.page;
    }

    let itemsPerPage = 4 ;

    Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
        
        if(err) return res.status(500).send({message:"Error devolver el seguimiento"});

        let follows_clean = [] ;

        follows.forEach((follow)=>{
            follows_clean.push(follow.followed);
        });

        Publication.find({user:{"$in":follows_clean}}).sort('-created_at').populate('user')
            .paginate(page, itemsPerPage, (err, publications,total) => {
                if(err) return res.status(500).send({message:"Error devolver publicaciones"});
                if(!publications) return res.status(404).send({message:"No hay publicaciones"});

                return res.status(200).send({
                    total_items: total,
                    pages: Math.ceil(total/itemsPerPage),
                    page:page,
                    items_per_page: itemsPerPage,
                    publications
                });

            });

    });
}

function getPublicationsUser(req, res){

    let page = 1 ; 

    if(req.params.page){
        page = req.params.page;
    }

    var user = req.user.sub ;

    if(req.params.user){
        user = req.params.user
    }

    let itemsPerPage = 4 ;

        Publication.find({user:user}).sort('-created_at').populate('user')
            .paginate(page, itemsPerPage, (err, publications,total) => {
                if(err) return res.status(500).send({message:"Error devolver publicaciones"});
                if(!publications) return res.status(404).send({message:"No hay publicaciones"});

                return res.status(200).send({
                    total_items: total,
                    pages: Math.ceil(total/itemsPerPage),
                    page:page,
                    items_per_page: itemsPerPage,
                    publications
                });
        });
}

function getPublication (req, res) {

    var publicationId = req.params.id ;

    Publication.findById(publicationId, (err, publication) => {

        if(err) return res.status(500).send({message:"Error devolver el seguimiento"});
        if(!publication) return res.status(500).send({message:"No existe la publicación"});

        return res.status(200).send({publication});
    });

}

const deletePublication = (req, res) => {

    let publicationId = req.params.id ;

    Publication.find({'user': req.user.sub, '_id':publicationId}).remove((err) => {

        if(err) return res.status(500).send({message: 'Error al borrar publicaciones'});
        // if(err) return res.status(404).send({message: 'no se ha borrado la publicación'});

        return res.status(200).send({message: "Publicación eliminada correctamente"});

    })
}

const uploadImage = (req, res) => {

    const publicationId = req.params.id ;

    if(req.files){

        let file_path  = req.files.image.path ;
        let file_split = file_path.split('/') ;
        let file_name = file_split[2] ;
        let ext_split = file_name.split('\.')
        let file_ext = ext_split[1];


        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {  
            //actualizar documento de la publicación

            Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new:true}, (err, publicationUpdated) => {

                if(err) return res.status(500).send({message: 'Error en la petición'});
                if(!publicationUpdated) return res.status(404).send({message: "No se ha podido actualizar el usuario"});
        
                return res.status(200).send({publication: publicationUpdated});

            });

        }else{
            removeFilesOfUploads(res, file_path, 'Extensión no válida');
        }

    }else{
        return res.status(200).send({message: "No se ha subido archivos"})
    }

};

const getImageFile = (req, res) => {

    let image_file = req.params.imageFile ;
    let path_file = './uploads/publications/'+image_file ;

    fs.exists(path_file, (exists)=>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: "No existe la imagen..."});
        }
    })

};

const removeFilesOfUploads = (res, file_path, message) => {
    fs.unlink(file_path, (err) => {
         return res.status(200).send({message: message});
    });
}    

module.exports = {
    savePublication,
    getPublications,
    getPublication,
    uploadImage,
    deletePublication,
    getImageFile,
    getPublicationsUser
}