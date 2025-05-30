# Quest Web Widget Demo

## Quick start

1. Install node
1. Run `npm i`
1. Copy .env.example to .env
1. Enter your details in to the .env file
1. Run `npm run dev`
1. Connect to localhost:3000

## Getting all providers working

You will need to do the following to get all providers working:

1. Expose your site externally with a real SSL and domain. The simplest way to do this is with ngrok by running `ngrok http 3000` and setting the environment variable BASE_URL to the ngrok address.
1. Register the Apple Pay certificate by adding the certificate to `public/.well-known/apple-developer-merchantid-domain-association.txt`. You will then need to verify the domain in Apple Pay.
1. Apple Pay will require iOS or Mac OS. You will need to register an Apple Pay sandbox account and add a sandbox test card https://developer.apple.com/apple-pay/sandbox-testing/.
