import React, { useState } from 'react';
import { Button, Modal } from '../components';

const TestComponents = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div style={{ padding: '20px' }}>
            <h1>组件测试页面</h1>

            <div style={{ marginBottom: '20px' }}>
                <Button
                    type="primary"
                    onClick={() => setIsModalOpen(true)}
                >
                    打开模态框
                </Button>
            </div>

            <Modal
                title="测试模态框"
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <div style={{ padding: '20px' }}>
                    这是一个测试模态框
                </div>
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button type="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                    <Button type="primary" onClick={() => setIsModalOpen(false)}>确认</Button>
                </div>
            </Modal>
        </div>
    );
};

export default TestComponents; 