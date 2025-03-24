import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ComponentTest from './pages/ComponentTest';
import { Layout, Navigation, Button } from './components';
import './App.css';

const App = () => {
    return (
        <Layout>
            <Layout.Header>
                <div className="app-header">
                    <div className="app-logo">Cherry Studio</div>
                    <Navigation
                        items={[
                            { key: 'dashboard', label: <Link to="/">仪表盘</Link> },
                            { key: 'components', label: <Link to="/components">组件测试</Link> }
                        ]}
                        mode="horizontal"
                        theme="dark"
                    />
                </div>
            </Layout.Header>

            <Layout.Content>
                <Button type="primary" style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
                    React Bits 测试按钮
                </Button>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/components" element={<ComponentTest />} />
                </Routes>
            </Layout.Content>
        </Layout>
    );
};

export default App; 