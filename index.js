'use strict'

const mongoose  = require('mongoose'),
           app  = require('./app'),
          port  = 3800 ; 

mongoose.Promise = global.Promise;

mongoose.connect('mongodb+srv://admindb:admin1234@cluster0.ox9b8.mongodb.net/socialappdb?retryWrites=true&w=majority', {useNewUrlParser:true, useUnifiedTopology: true} )
    .then(()=>{
        console.log("La conexión se ha realizado correctamente")

        //Crear servidor 
        
        app.listen(port, () => {  
            console.log("Servidor corriendo en http://localhost:3800");
        });

    }).catch(err => console.log(err));