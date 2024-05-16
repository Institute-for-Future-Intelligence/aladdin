/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import CookieConsent from 'react-cookie-consent';
import i18n from './i18n/i18n';
import { useLanguage } from './views/hooks';

const AcceptCookie = React.memo(() => {
  const lang = useLanguage();
  return (
    <CookieConsent
      location="bottom"
      buttonText={i18n.t('cookie.Accept', lang)}
      cookieName="AladdinCookieName"
      style={{ background: '#2B373B', textAlign: 'center', zIndex: 99999 }}
      buttonStyle={{ color: '#4e503b', fontSize: '12px' }}
      expires={150}
    >
      {i18n.t('cookie.Statement', lang)}
    </CookieConsent>
  );
});

export default AcceptCookie;
