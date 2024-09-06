const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en', 'ro'], // List all the languages you want to preload
    backend: {
      loadPath: './locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['querystring', 'cookie', 'header', 'session', 'localStorage', 'navigator'],
      caches: ['cookie']
    }
  });

module.exports = i18next;
