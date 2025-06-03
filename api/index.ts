import express from 'express';
import { engine } from 'express-handlebars';
import { getCompleteUrl, settings } from './common';
import { completeTransaction, performPayment, startWebWidget } from './ecommerce';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', `${__dirname}/../views`);

app.get('/', async (req, res) => {
  const token = await startWebWidget(settings.transactionAmount, settings.transactionCurrency);
  res.render('index', {
    webWidgetScript: JSON.stringify(settings.webWidgetScript),
    token: JSON.stringify(token),
  });
});

app.post('/pay', async (req, res) => {
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

app.use(express.static(`${__dirname}/../public/`));
app.use('/.well-known', express.static(`${__dirname}/../public/.well-known`));

app.listen(settings.listenPort, () => {
  console.log(`Listening on port ${settings.listenPort}`);
});

module.exports = app;
