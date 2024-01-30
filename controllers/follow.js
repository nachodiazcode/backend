'use strict'

// const path = require('path');
// const fs = require('fs');

const mongoosePaginate = require('mongoose-pagination');

//modelos
const User = require('../models/user');
const Follow = require('../models/follow');

const saveFollow = ((req, res) => {

    const params = req.body ;

    const follow = new Follow();

    follow.user = req.user.sub;
    follow.followed = params.followed ;

    follow.save((err, followStored) => {

        if(err) return res.status(500)
            .send({
                message: 'Error al guardar el seguimiento'
            });
        if (!followStored) return res.status(404)
            .send({
                message: 'El seguimiento no se ha guardado'
            });

        return res.status(200).send({follow:followStored});

    });

});

const deleteFollow = ((req, res) => {

    let userId = req.user.sub;
    let followId = req.params.id ;

    Follow.find({'user':userId, 'followed': followId}).remove(err => {
        if(err) return res.status(500).send({message: 'Error al dejar de seguir al usuario'});
        return res.status(200).send({message:"El follow se ha eliminado"});
    });

});

const getFollowingUsers = ((req, res) => {

    let userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id ;
    }

    let page = 1 ;

    if (req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    let itemsPerPage = 4 ;

    Follow.find({user:userId}).populate({path:'followed'})
        .paginate(page, itemsPerPage, (err, follows, total) => {

        if(err) return res.status(500).send({message: 'Error en el servidor '});
        if(!follows) return res.status(404).send({message: 'No estas siguiendo ningún usuario'});

        followUsersIds(req.user.sub).then((value) => {

            return res.status(200).send({
                total: total,
                pages:Math.ceil(total/itemsPerPage),
                follows,
                users_following: value.following,
                user_follow_me: value.followed
            });
        });
    });
});

const getFollowedUsers = ((req, res) => {

    let userId = req.user.sub;

    if(req.params.id && req.params.page){
        userId = req.params.id ;
    }

    let page = 1 ;

    if (req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id ;
    }

    let itemsPerPage = 4 ;

    Follow.find({followed:userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total) => {

        if(err) return res.status(500).send({message: 'Error en el servidor '});
        if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});

        followUsersIds(req.user.sub).then((value) => {

            return res.status(200).send({
                total: total,
                pages:Math.ceil(total/itemsPerPage),
                follows,
                users_following: value.following,
                user_follow_me: value.followed
            });
        });
    });

});

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

//Devolver el listado de usuarios

const getMyFollows = ((req, res) => {

    let userId = req.user.sub;

    let find = Follow.find({user:userId}) ;

    if (req.params.followed){
        find = Follow.find({followed: userId});
    }   

    find.populate('user').exec((err, follows )=> {

        if(err) return res.status(500).send({message: 'Error en el servidor '});
        if(!follows) return res.status(404).send({message: 'No sigues ningun usuario'});

        return res.status(200).send({follows});

    });

});







module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}
