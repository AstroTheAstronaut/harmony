const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const path = require('path');

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en', 'ro', 'es', 'it'], // Preload supported languages
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}/translation.json'), // Better: use absolute path
    },
    detection: {
      order: ['querystring', 'cookie', 'header'], // Removed unsupported methods like navigator/localStorage
      caches: ['cookie'],
      cookieSecure: false, // Set to true in production if using HTTPS
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
    },
    debug: false,
  });

module.exports = i18next;
