import z from 'zod';

const schema = z.object({
  listenPort: z.number().int().positive(),
  uppHost: z.string().url(),
  uppToken: z.string().min(1),
  uppPublicToken: z.string().min(1),
  webWidgetScript: z.string().url(),
  transactionAmount: z.number().positive(),
  transactionCurrency: z.string().length(3),
  baseUrl: z.string().url(),
});

const values: z.infer<typeof schema> = {
  listenPort: +(process.env.LISTEN_PORT ?? 3000),
  uppHost: process.env.UPP_HOST ?? 'https://payments.upp.sandbox.qps.io',
  uppToken: process.env.UPP_TOKEN!,
  uppPublicToken: process.env.UPP_PUBLIC_TOKEN!,
  webWidgetScript: process.env.WEB_WIDGET_SCRIPT ?? 'https://static.qps.io/upp/temp/web-widget.js',
  transactionAmount: +(process.env.TRANSACTION_AMOUNT ?? 1.0),
  transactionCurrency: process.env.TRANSACTION_CURRENCY ?? 'aud',
  baseUrl: process.env.BASE_URL!,
};

export const settings = schema.parse(values);

export const getCompleteUrl = (transactionReference: string) =>
  new URL(`/complete?transactionReference=${transactionReference}`, settings.baseUrl).toString();
