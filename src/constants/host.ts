export const APP_PATH =
  process.env.NODE_ENV === 'prod'
    ? 'https://nestjsdesignli-production.up.railway.app/json-scraping'
    : 'http://localhost:3000/json-scraping';
