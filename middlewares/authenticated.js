'use strict'

const jwt     = require('jwt-simple'),
      moment  = require('moment'),
      secret  = 'clave_secreta_curso_desarrollar_red_social_angular';

exports.ensureAuth = (req, res, next) => {

    if(!req.headers.authorization){
        return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
    }

    var token = req.headers.authorization.replace(/['"]+/g, '');
    
    try{
        
        var payload = jwt.decode(token, secret);

        if(payload.exp <= moment().unix()){

            return res.status(401).send({
                message: 'El token ha expirado'
            });
        }

    }catch(ex){
        console.log(ex);
        res.status(404).send({
            message: 'El token no es válido'
        });
    }

    req.user = payload ; 

    next();

}
