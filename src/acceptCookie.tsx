/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import CookieConsent from "react-cookie-consent";

const AcceptCookie = () => {
    return <CookieConsent
        location="bottom"
        buttonText="Accept"
        cookieName="AladdinCookieName"
        style={{background: "#2B373B", textAlign: 'center', zIndex: 99999}}
        buttonStyle={{color: "#4e503b", fontSize: "12px"}}
        expires={150}
    >
        By clicking Accept, you agree to our use of cookies to improve your experience with Aladdin.
    </CookieConsent>;
};

export default AcceptCookie;
