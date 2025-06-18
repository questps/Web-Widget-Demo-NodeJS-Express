import { getCompleteUrl, settings } from './common';

async function ecommerceRequest(url: string, body: any) {
  const fullUrl = new URL(url, settings.uppHost);
  const request = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.uppToken}`,
    },
    body: JSON.stringify(body),
  });

  let response = await request.json();
  if (!request.ok) throw new Error(`Failed with status ${request.status}: ${JSON.stringify(response)}`);
  return response;
}

export async function startWebWidget(amount: number, currency: string) {
  return await ecommerceRequest('/v1/startWebWidget', {
    amount,
    currency,
  });
}

export async function performPayment({
  transactionReference,
  ipAddress,
  amount,
  currency,
  webWidget,
  provider,
  customerToken,
}: {
  transactionReference: string;
  ipAddress: string;
  amount: number;
  currency: string;
  webWidget: any;
  provider?: string;
  customerToken?: string;
}) {
  const body: any = {
    transactionType: 'purchase',
    amount: amount,
    currency,
    transactionReference,
    clientIpAddress: ipAddress,
    saleType: 'website',
    provider,
    customerToken,
    webWidget,
    items: [
      {
        type: 'sku',
        itemReference: '1',
        name: 'Pen',
        amount: amount,
        quantity: 1,
      },
    ],
    billing: {
      firstName: 'Homer',
      lastName: 'Simpson',
      line1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'Vic',
      postCode: '3000',
      countryCode: 'au',
    },
    shipping: {
      isPickup: false,
      address: {
        firstName: 'Homer',
        lastName: 'Simpson',
        line1: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'Vic',
        postCode: '3000',
        countryCode: 'au',
      },
    },
    shopper: {
      firstName: 'Homer',
      lastName: 'Simpson',
      dateOfBirth: '1989/12/17',
      email: 'homer.simpson@springfield-power.com',
      phone: '039123456',
    },
    ...(provider !== 'financialcard' && { returnUrl: getCompleteUrl(transactionReference) }),
  };
  return await ecommerceRequest('/v1/transactions', body);
}

export async function completeTransaction(transactionReference: string) {
  return await ecommerceRequest(`/v1/transactions/${transactionReference}/complete`, {});
}
