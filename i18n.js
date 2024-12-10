const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en', 'ro', 'es', 'it'], // List all the languages you want to preload
    backend: {
      loadPath: './locales/{{lng}}/translation.json', // Path to your translation files
    },
    detection: {
      order: ['navigator', 'querystring', 'cookie', 'header', 'session', 'localStorage'], // Prioritize navigator
      caches: ['cookie'], // Store the detected language in cookies
    }
  });

module.exports = i18next;
