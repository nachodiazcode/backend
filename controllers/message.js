'use strict'

const moment = require('moment')
const mongoosePaginate = require('mongoose-pagination')

const User = require('../models/user')
const Follow = require('../models/follow')
const Message = require('../models/message')

const probando = (req, res) => {
    res.status(200).send({message:'Hola que tal'});
}

function saveMessage(req, res) {

    var params = req.body ;

    if(!params.text || !params.receiver) return res.status(200).send({message: 'Envia los datos necesarios'});

    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text ;
    message.created_at = moment().unix();

    message.save((err, messageStored) => {

        if(!params.text || !params.receiver) return res.status(500).send({message: 'Error en la petición'});
        if(!params.text || !params.receiver) return res.status(404).send({message: 'Error al enviar el mensaje'});

        res.status(200).send({message: messageStored});

    });

}

function getReceivedMessages(req, res){

    const userId = req.user.sub ;

    let page = 1 ;

    if(req.params.page){
        page = req.params.page ;
    }

    let itemsPerPage = 4;

    Message.find({receiver: userId}).populate('receiver emitter', 'name surname image nick _id').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total) => {

        if(err) return res.status(500).send({messages: 'Error en la petición'});
        if(!messages) return res.status(404).send({messages: 'No hay mensajes'});

        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });

}


function getEmitterMessages(req, res){

    const userId = req.user.sub ;

    let page = 1 ;

    if(req.params.page){
        page = req.params.page ;
    }

    let itemsPerPage = 4;

    Message.find({emitter: userId}).populate('emitter receiver', 'name surname image nick _id').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total) => {

        if(err) return res.status(500).send({messages: 'Error en la petición'});
        if(!messages) return res.status(404).send({messages: 'No hay mensajes'});

        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });

}

function getUnviewedMessages(req, res){

    const userId = req.user.sub;

    Message.find({receiver:userId, viewd:'false'}).exec((err, count)=>{
        if (err) return res.status(500).send({messages: 'Error en la petición'});

        return res.status(200).send({
            'unviwed': count
        });
    })

}

function setViewedMessages(req, res){

    const userId = req.user.sub;

    Message.update({receiver: userId, viewed:'false'}, {viewed:'true'}, {'multi':true}, (err, messageUpdated)=>{
        if (err) return res.status(500).send({messages: 'Error en la petición'});
        return res.status(200).send({
            messages: messageUpdated
        });
    })

}

module.exports = {
    probando,
    saveMessage,
    getReceivedMessages,
    getEmitterMessages,
    getUnviewedMessages,
    setViewedMessages
}