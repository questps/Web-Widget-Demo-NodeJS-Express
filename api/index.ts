import express from 'express';
import { engine } from 'express-handlebars';
import { getCompleteUrl, settings } from './common';
import { completeTransaction, performPayment, startWebWidget } from './ecommerce';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', `${__dirname}/../views`);
app.get('/.well-known/apple-developer-merchantid-domain-association.txt', (_, res) => {
  const applePayCert = process.env.APPLEPAY_DOMAIN_ASSOCIATION;
  if (!applePayCert) {
    res.status(404).send('Not found');
    return;
  }

  res.type('text/plain').send(Buffer.from(applePayCert, 'base64'));
});

app.get('/', async (req, res) => {
  const amount = typeof req.query.amount === 'string' ? +req.query.amount : settings.defaultTransactionAmount;
  const token = await startWebWidget(amount, settings.transactionCurrency);
  res.render('index', {
    uppPublicToken: settings.uppPublicToken,
    webWidgetScript: JSON.stringify(settings.webWidgetScript),
    token: JSON.stringify(token),
    amount,
    completeClass: 'pending',
  });
});

app.post('/pay-web-widget', async (req, res) => {
  const { webWidget, amount } = req.body;
  if (!webWidget || typeof amount !== 'string') {
    res.status(400).send('Provider and amount is required');
    return;
  }

  const transactionReference = crypto.randomUUID();
  const result = await performPayment({
    transactionReference,
    ipAddress: req.ip ?? '',
    amount: +amount,
    currency: settings.transactionCurrency,
    webWidget: JSON.parse(webWidget),
  });

  if ('sendCustomerToUrl' in result) {
    res.redirect(result.sendCustomerToUrl);
    return;
  }

  res.redirect(getCompleteUrl(transactionReference));
});

app.post('/pay-financial-card', async (req, res) => {
  const { 'card-token': cardToken, amount } = req.body;
  if (!cardToken || typeof amount !== 'string') {
    res.status(400).send('Card token and amount is required');
    return;
  }
  const transactionReference = crypto.randomUUID();
  const result = await performPayment({
    transactionReference,
    ipAddress: req.ip ?? '',
    amount: +amount,
    currency: settings.transactionCurrency,
    provider: 'financialcard',
    customerToken: cardToken,
    webWidget: undefined,
  });

  if ('sendCustomerToUrl' in result) {
    res.redirect(result.sendCustomerToUrl);
    return;
  }

  res.redirect(getCompleteUrl(transactionReference));
});

app.get('/complete', async (req, res) => {
  const transactionReference = req.query.transactionReference;
  if (typeof transactionReference !== 'string') {
    res.status(400).send('transaction reference is required');
    return;
  }

  const result = await completeTransaction(transactionReference);
  res.render('result', {
    approved: result.approved ? 'APPROVED' : 'DECLINED',
  });
});

app.listen(settings.listenPort, () => {
  console.log(`Listening on port ${settings.listenPort}`);
});

module.exports = app;
