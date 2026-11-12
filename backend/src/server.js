const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` Sumora Backend running on port ${config.port}`);
  console.log(` Environment: ${config.env}`);
  console.log(` Health Check: http://localhost:${config.port}/api/health`);
  console.log(`===============================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = server;

