<p align="center">
  <a href="https://designli.co/" target="blank"><img src="https://www.businessofapps.com/wp-content/uploads/2023/06/designli_logo_for_boa.png" width="120" alt="Designli Logo" /></a>
</p>

<p align="center">An API made to scrape JSON starting from a mail file</p>

## Description
A skill test from [Designli](https://designli.co/), using TypeScript, Nest and mailparser

## Test on the fly!*
API: [https://nestjsdesignli-production.up.railway.app/json-scraping](https://nestjsdesignli-production.up.railway.app/json-scraping)

With cURL:

```bash
$ curl -X POST -H "Content-Type: application/json" -d '{"path": "https://proud-of.s3.filebase.com/Test JSON from link of Github JSON.eml"}' https://nestjsdesignli-production.up.railway.app/json-scraping
```

The cloud API only work with cloud hosted .eml file, such as: https://proud-of.s3.filebase.com/Test JSON from link of Github JSON.eml*

## Installation
```bash
$ npm install
```

## Running the app

```bash
# watch mode
$ npm run dev

# development
$ npm run start

# production
$ npm run build
$ npm run start:prod
```

## Test
```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```