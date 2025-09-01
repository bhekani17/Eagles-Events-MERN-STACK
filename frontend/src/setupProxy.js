const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      // Do NOT strip /api; backend expects it (app.use('/api', ...))
      logLevel: 'info',
    })
  );
};
