<p align="center">
  <a href="https://designli.co/" target="blank"><img src="https://www.businessofapps.com/wp-content/uploads/2023/06/designli_logo_for_boa.png" width="120" alt="Designli Logo" /></a>
</p>

<p align="center">An API made to scrape JSON starting from a mail file</p>

## Description
A skill test from [Designli](https://designli.co/), using TypeScript, Nest and mailparser

Deadline: 2 days

Instructions: [Skill test](https://docs.google.com/forms/d/e/1FAIpQLSd44iat8Iv6tTL0xxTTlAzNIxudQYwNwZFBx8sL4jYQe3Vo6A/viewform?pli=1)

Cache Ready 🚀!

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
Running the app locally you can send an absolute path from your local machine that contains a .eml file (`/Users/pcowner/Downloads/mail_with_attachment.eml`)

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
