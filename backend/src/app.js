const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());

// Support Atom/XML bodies for WebSub webhooks (with 2MB body limit to prevent payload DoS)
app.use(express.text({ type: ['application/atom+xml', 'application/xml', 'text/xml'], limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', routes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
