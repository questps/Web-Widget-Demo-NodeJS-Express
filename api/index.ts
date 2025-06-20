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
  const token = await startWebWidget(settings.transactionAmount, settings.transactionCurrency);
  res.render('index', {
    uppPublicToken: settings.uppPublicToken,
    webWidgetScript: JSON.stringify(settings.webWidgetScript),
    token: JSON.stringify(token),
  });
});

app.post('/pay-web-widget', async (req, res) => {
  const { webWidget } = req.body;
  if (!webWidget) {
    res.status(400).send('Provider is required');
    return;
  }

  const transactionReference = crypto.randomUUID();
  const result = await performPayment({
    transactionReference,
    ipAddress: req.ip ?? '',
    amount: settings.transactionAmount,
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
  const { 'card-token': cardToken } = req.body;
  if (!cardToken) {
    res.status(400).send('Provider is required');
    return;
  }
  const transactionReference = crypto.randomUUID();
  const result = await performPayment({
    transactionReference,
    ipAddress: req.ip ?? '',
    amount: settings.transactionAmount,
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
