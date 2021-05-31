/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export const VERSION = '0.0.1';

export const isProd = process.env.NODE_ENV === 'production';

export const HOME_URL: string = isProd ? 'https://aladdin.intofuture.org' : 'http://aladdin.dev';
