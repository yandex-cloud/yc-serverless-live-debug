export const isProd = process.env.APP_ENV == 'production';
export const isDev = !isProd;
