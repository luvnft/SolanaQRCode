import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Wallet } from './Wallet'; // Import Wallet component
const process = require('process');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Wallet>
    <App />
  </Wallet>
);
