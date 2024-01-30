'use strict'

const User   = require('../models/user'),
      Follow = require('../models/follow'),
      bcrypt = require('bcrypt-nodejs'),
      jwt    = require('../services/jwt');

const mongoosePaginate = require('mongoose-pagination');
const Publication = require('../models/publication');

const fs = require('fs');
const path = require('path');
// const { response } = require('../app');

const home = ((req, res) => {

    res.status(200).send({
        message:'Api para una red social'
    });

});

//Guardar usuario

const saveUser = (req, res) => {

    let params = req.body ;
    let user = new User();

    if( params.name && params.surname &&  params.nick && params.email && params.password ){

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.image = "null";
        user.role = "ROLE_USER";

        //Controlar usuarios duplicados
        User.find({ $or: [
            {email: user.email.toLowerCase()},
            {nick: user.nick.toLowerCase()}
        
        ]}).exec((err, users) => {
            if(err) return res.status(500).send({message: 'Error en la petición de usuarios'});

            if(users && users.length >= 1 ) {
                return res.status(200).send({message:'El usuario que intentas registrar ya existe'});
            }else{

                //Cifra la contraseña y guarda los datos
                bcrypt.hash(params.password, null, null, (err, hash)=>{

                        user.password = hash ; 

                        user.save((err, userStored) => {

                        if (err) return res.status(500).send({menubar: 'Error al guardar el usuario'});

                        if(userStored) {
                        res.status(200).send({user: userStored});
                        }else{
                        res.status(404).send({message:'No se ha registrado el usuario'});
                        }

                    });

                });
            }
        });

    } else {

        res.status(200).send({
            message: ' Envia todo los campos' 
        });

    }

};

//Loguear usuario

const loginUser = (req, res) => {

    const params = req.body ;
    let email = params.email ;
    let password = params.password ;

    User.findOne({email: email}, (err, user) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});
        
        if(user){

            bcrypt.compare(password, user.password, (err, check) => {
                if(check){
                    
                    if(params.gettoken){
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{
                        user.password = undefined ;

                        return res.status(200).send({   
                            user
                        })
                    }

                }else{
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'});
                }
                
            });
        }
    });

}

const getUser = (req, res) => {

    let userId = req.params.id ; 

    User.findById(userId, (err, user) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(!user) return res.status(404).send({message: 'El usuario no existe'});

        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;

            return res.status(200).send({
                    user,
                    following: value.following,
                    followed: value.followed
            
                });
        });
          
    });

};

const followThisUser = async (identity_user_id, user_id) => {

    var following = await Follow.findOne({"user":identity_user_id, "followed":user_id}).exec().then(( follow)=>{
        return follow ;
    }).catch((err)=>{
        return handleError(err);
    });

    var followed = await Follow.findOne({"user":user_id, "followed":identity_user_id}).exec().then((follow)=>{
        return follow ;
    }).catch((err)=>{
        return handleError(err)
    });

    return {
       following:following,
        followed:followed
    }
}

const getUsers = (req, res) => {

    let identity_user_id = req.user.sub ;

    var page = 1 ;

    if(req.params.page){
        page = req.params.page ;
    }

    var itemsPerPage = 5 ;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {

        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});

        followUsersIds(identity_user_id).then((value)=>{
  
            return res.status(200).send({
                users,
                total,
                pages: Math.ceil(total/itemsPerPage),
                users_following: value.following,
                users_follow_me: value.followed
            })

        });

    });

};

async function followUsersIds(user_id){

    try {
        var following = await Follow.find({ 'user': user_id }).select({ '_id': 0, '__v': 0, 'user': 0 }).exec()
            .then((follows) => {
 
                let follows_clean = []
 
                follows.forEach((follow) => {
                    follows_clean.push(follow.followed)
                });
 
                return follows_clean;
 
            })
            .catch((err) => {
                return handleError(err);
            });
  
        var followed = await Follow.find({ 'followed': user_id }).select({ '_id': 0, '__v': 0, 'followed': 0 }).exec()
            .then((follows) => {
 
                let follows_clean = []
 
                follows.forEach((follow) => {
                    follows_clean.push(follow.user)
                });
                return follows_clean;
            })
            .catch((err) => {
                return handleError(err);
            });

        return {
            following: following,
            followed: followed
        }
 
    } catch (error) {
        console.log(error);
    }
}


function getCounters (req, res) {

    var userId = req.user.sub ;

   if (req.params.id){
    userId =req.params.id ;
   }

   getCountFollow(userId).then((value)=>{
       return res.status(200).send(value);
   })


}

async function getCountFollow  (user_id)  {


        var following = await Follow.count({"user":user_id})
        .exec()
        .then((following)=>{
            return following
        }).catch((err)=>{
            console.log(err);
        })

        var followed = await Follow.count({"followed":user_id})
        .exec()
        .then((following)=>{
            return following
        }).catch((err)=>{
            console.log(err);
        })

        var publications = await Publication.count({"user":user_id})
        .exec()
        .then((following)=>{
            return following
        }).catch((err)=>{
            console.log(err);
        })
    

    return {
        following : following,
        followed: followed,
        publications: publications
    }

}

const updateUser = (req, res) =>{

    var userId = req.params.id ;
    var update = req.body ;

    delete update.password ; 

    if (userId != req.user.sub) { 
        return res.status(500).send({message:"No tienes permisos para actualizar los datos del usuario"});
    }

    User.findOne({
        $or:[
            {email: update.email.toLowerCase},
            {nick: update.nick.toLowerCase}
        ]
    }).exec((error, user) => {

        if(user && user._id != userId ) return res.status(500).send({message: "Email o password no disponibles"});

        User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {

            if(err) return res.status(500).send({message: 'Error en la petición'});
            if(!userUpdated) return res.status(404).send({message: "No se ha podido actualizar el usuario"});
    
            return res.status(200).send({user: userUpdated});
    
        });

    })  

};

const uploadImage = (req, res) => {

    const userId = req.params.id ;

    if(req.files){

        let file_path  = req.files.image.path ;
        let file_split = file_path.split('/') ;
        let file_name = file_split[2] ;
        let ext_split = file_name.split('\.')
        let file_ext = ext_split[1];

        // console.log(file_ext);

    if (userId != req.user.sub) { 
        removeFilesOfUploads(res, file_path, "No tienes permisos para actualizar los datos del usuario");
    }

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif') {  
            //actualizar documento de usuario logueado

            User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdated) => {

                if(err) return res.status(500).send({message: 'Error en la petición'});
                if(!userUpdated) return res.status(404).send({message: "No se ha podido actualizar el usuario"});
        
                return res.status(200).send({user: userUpdated});

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
    let path_file = './uploads/users/'+image_file ;

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
    home,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile,
    
}