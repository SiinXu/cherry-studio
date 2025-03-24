import React from 'react';
import { Button } from '../components';

const SimpleTest = () => {
    return (
        <div style={{ padding: '50px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
            <h1>简单组件测试</h1>
            <Button>默认按钮</Button>
            <Button type="primary" style={{ marginLeft: '10px' }}>主要按钮</Button>
        </div>
    );
};

export default SimpleTest; 