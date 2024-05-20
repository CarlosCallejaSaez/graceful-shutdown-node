const express = require('express');
const http = require('http');
const mongoose = require('mongoose'); 
const cron = require('node-cron');
const fs = require('fs'); 

const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('¡Hola Mundo!');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`El servidor está funcionando en el puerto ${PORT}`);
});

// Conexión a la base de datos 
mongoose.connect('mongodb://localhost:27017/shutdown')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB', err));



// Trabajo en segundo plano 
const job = cron.schedule('* * * * *', () => {
  console.log('Ejecutando un trabajo en segundo plano cada minuto -Carlos Calleja-');
});

// Simular un manejador de archivo abierto 
const fileHandle = fs.openSync('capitales.txt', 'r');

// Apagado gradual
const gracefulShutdown = async () => {
  console.log('Recibida señal de apagado, apagando de manera gradual...');

  // Dejar de aceptar nuevas conexiones
  server.close(async (err) => {
    if (err) {
      console.error('Error al apagar el servidor:', err);
      process.exit(1);
    }

    console.log('Cerradas las conexiones restantes.');

    // Realizar tareas de limpieza
    try {
      await performCleanupTasks();
      console.log('Tareas de limpieza completadas.');
      process.exit(0);
    } catch (cleanupErr) {
      console.error('Error durante las tareas de limpieza:', cleanupErr);
      process.exit(1);
    }
  });

  // Forzar apagado si no se completa en 10 segundos
  setTimeout(() => {
    console.error('Forzando el apagado después del tiempo límite.');
    process.exit(1);
  }, 10000);
};

// Ejemplo de tareas de limpieza
const performCleanupTasks = async () => {
    console.log('Realizando tareas de limpieza...');
  
    // Cerrar conexión a la base de datos
    try {
      await mongoose.connection.close();
      console.log('Conexión a la base de datos cerrada.');
    } catch (err) {
      console.error('Error al cerrar la conexión a la base de datos:', err);
    }
  

  
    // Detener trabajo en segundo plano
    try {
      job.stop();
      console.log('Trabajo en segundo plano detenido.');
    } catch (err) {
      console.error('Error al detener el trabajo en segundo plano:', err);
    }
  
    // Cerrar manejador de archivo
    try {
      fs.closeSync(fileHandle);
      console.log('Manejador de archivo cerrado.');
    } catch (err) {
      console.error('Error al cerrar el manejador de archivo:', err);
    }
  };

// Escuchar señales de terminación
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
