import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './components/Button.css';
import './components/Input.css';
import './components/Select.css';
import './components/Checkbox.css';
import './components/Radio.css';
import './components/Switch.css';
import './components/Form.css';
import './components/Modal.css';
import './components/Alert.css';
import './components/Card.css';
import './components/Tooltip.css';
import './components/Table.css';
import './components/Tabs.css';
import './components/Layout.css';
import './components/Navigation.css';
import './components/Breadcrumb.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 