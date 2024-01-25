/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { message } from 'antd';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { DatumEntry } from './types';

export const visitIFI = () => {
  window.open('https://intofuture.org', '_blank');
};

export const visitHomepage = () => {
  window.open('https://intofuture.org/aladdin.html', '_blank');
};

export const getSatelliteImage = (size: number, lat: number, lng: number, zoom: number) => {
  return (
    'https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=' +
    lat +
    ',' +
    lng +
    '&zoom=' +
    zoom +
    '&size=' +
    size +
    'x' +
    size +
    '&scale=2&key=' +
    process.env.REACT_APP_MAPS_API_KEY
  );
};

export const getRoadMap = (size: number, lat: number, lng: number, zoom: number) => {
  return (
    'https://maps.googleapis.com/maps/api/staticmap?maptype=roadmap&style=feature:poi|element:labels|visibility:off&center=' +
    lat +
    ',' +
    lng +
    '&zoom=' +
    zoom +
    '&size=' +
    size +
    'x' +
    size +
    '&scale=2&key=' +
    process.env.REACT_APP_MAPS_API_KEY
  );
};

export const showSuccess = (msg: string, duration?: number) => {
  message.success({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const showInfo = (msg: string, duration?: number) => {
  message.info({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const showWarning = (msg: string, duration?: number) => {
  message.warning({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const showError = (msg: string, duration?: number) => {
  message.error({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const openInNewTab = (url: string) => {
  const win = window.open(url, '_blank');
  if (win) {
    win.focus();
  }
};

export const extractText = (html: string) => {
  return new DOMParser().parseFromString(html, 'text/html').documentElement.textContent;
};

export const containedInDOMRect = (rect: DOMRect, x: number, y: number, margin: number) => {
  return (
    x > rect.x - margin && x < rect.x + rect.width + margin && y > rect.y - margin && y < rect.y + rect.height + margin
  );
};

export const saveImage = (fileName: string, imgUrl: string) => {
  let a = document.createElement('a') as HTMLAnchorElement;
  a.download = fileName;
  a.href = imgUrl;
  a.click();
};

export const screenshot = async (elementId: string, name: string, options: {}) => {
  const source = window.document.getElementById(elementId);
  if (source) {
    const canvas = await html2canvas(source, { ...options, removeContainer: true });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png', 1.0);
    a.download = `${name}.png`;
    a.click();
  } else {
    throw new Error(`Cannot find element with ID ${elementId}`);
  }
};

export const saveCsv = (data: DatumEntry[], fileName: string) => {
  let content = '';
  for (const k of Object.keys(data[0])) {
    content += k + ', ';
  }
  content += '\n';
  for (const o of data) {
    for (const v of Object.values(o)) {
      content += v + ', ';
    }
    content += '\n';
  }
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, fileName);
};
