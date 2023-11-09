/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { createRoot } from 'react-dom/client';
import App from './app';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
