/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import {message} from "antd";

export const visitIFI = () => {
    window.open("https://intofuture.org", '_blank');
};

export const getMapImage = (size: number, lat: number, lng: number, zoom: number) => {
    return "https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=" + lat + "," + lng
        + "&zoom=" + zoom + "&size=" + size + "x" + size + "&scale=2&key=" + process.env.REACT_APP_MAPS_API_KEY;
}

export const showSuccess = (msg: string) => {
    message.success({
        content: msg,
        className: 'custom-class',
        style: {
            marginTop: '20vh',
        },
        onClick: () => {
            message.destroy();
        }
    });
};

export const showInfo = (msg: string) => {
    message.info({
        content: msg,
        className: 'custom-class',
        style: {
            marginTop: '20vh',
        },
        onClick: () => {
            message.destroy();
        }
    });
};

export const showWarning = (msg: string) => {
    message.warning({
        content: msg,
        className: 'custom-class',
        style: {
            marginTop: '20vh',
        },
        onClick: () => {
            message.destroy();
        }
    });
};

export const showError = (msg: string) => {
    message.error({
        content: msg,
        className: 'custom-class',
        style: {
            marginTop: '20vh',
        },
        onClick: () => {
            message.destroy();
        }
    });
};

export const fahrenheitToCelsius = (temp: number) => {
    return ((temp - 32) * 5) / 9;
};

export const celsiusToFahrenheit = (temp: number) => {
    return temp * (9 / 5) + 32;
};

export const openInNewTab = (url: string) => {
    const win = window.open(url, '_blank');
    if (win) {
        win.focus();
    }
};

export const extractText = (html: string) => {
    return new DOMParser().parseFromString(html, "text/html").documentElement.textContent;
};

export const containedInDOMRect = (rect: DOMRect, x: number, y: number, margin: number) => {
    return x > rect.x - margin && x < rect.x + rect.width + margin
        && y > rect.y - margin && y < rect.y + rect.height + margin;
};
