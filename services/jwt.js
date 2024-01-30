'use strict'

const jwt    = require('jwt-simple'),
      moment = require('moment');

const secret = 'clave_secreta_curso_desarrollar_red_social_angular';
      
exports.createToken = (user) => {

    let payload = {

        sub: user._id,
        name: user.name,
        nick: user.nick,
        surname: user.surname,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()

    };

    return jwt.encode(payload, secret );

}