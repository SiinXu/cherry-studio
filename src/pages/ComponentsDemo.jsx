import React, { useState } from 'react';
import {
    Button,
    Input,
    Select,
    Checkbox,
    Radio,
    Switch,
    Form,
    Modal,
    Tooltip,
    Alert,
    Card,
    Tabs
} from '../components';

const ComponentsDemo = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [switchValue, setSwitchValue] = useState(false);
    const [selectedTab, setSelectedTab] = useState('buttons');
    const [formValues, setFormValues] = useState({
        name: '',
        email: '',
        agreement: false
    });

    const handleFormSubmit = (values) => {
        console.log('Form submitted:', values);
        alert('Form submitted: ' + JSON.stringify(values, null, 2));
    };

    return (
        <div className="components-demo">
            <h1>React Bits Components</h1>

            <Tabs
                value={selectedTab}
                onChange={setSelectedTab}
                variant="contained"
            >
                <Tabs.Tab label="按钮" value="buttons" />
                <Tabs.Tab label="表单控件" value="inputs" />
                <Tabs.Tab label="反馈组件" value="feedback" />
                <Tabs.Tab label="数据展示" value="display" />

                <Tabs.Panel value="buttons">
                    <Card className="demo-card">
                        <Card.Header title="按钮组件" />
                        <Card.Content>
                            <div className="button-group">
                                <Button>默认按钮</Button>
                                <Button type="primary">主要按钮</Button>
                                <Button type="secondary">次要按钮</Button>
                                <Button type="danger">危险按钮</Button>
                                <Button type="success">成功按钮</Button>
                                <Button type="warning">警告按钮</Button>
                                <Button type="info">信息按钮</Button>
                            </div>
                        </Card.Content>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="inputs">
                    <Card className="demo-card">
                        <Card.Header title="表单组件" />
                        <Card.Content>
                            <Form
                                onSubmit={handleFormSubmit}
                                initialValues={formValues}
                            >
                                <Form.Item label="用户名" name="name" required>
                                    <Input placeholder="请输入用户名" />
                                </Form.Item>

                                <Form.Item label="邮箱" name="email" required>
                                    <Input type="email" placeholder="请输入邮箱" />
                                </Form.Item>

                                <Form.Item name="agreement">
                                    <Checkbox label="我同意服务条款" />
                                </Form.Item>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                                    <Button type="secondary">取消</Button>
                                    <Button type="primary" htmlType="submit">提交</Button>
                                </div>
                            </Form>
                        </Card.Content>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="feedback">
                    <Card className="demo-card">
                        <Card.Header title="反馈组件" />
                        <Card.Content>
                            <Alert
                                type="info"
                                title="信息提示"
                                message="这是一条信息提示"
                                closable
                            />

                            <div style={{ marginBottom: '16px' }}>
                                <Button onClick={() => setModalOpen(true)}>打开模态框</Button>
                            </div>

                            <Tooltip title="这是一个提示文本">
                                <Button type="secondary">悬停查看提示</Button>
                            </Tooltip>

                            <Modal
                                title="模态框标题"
                                open={modalOpen}
                                onClose={() => setModalOpen(false)}
                            >
                                <div style={{ padding: '16px 0' }}>
                                    这是模态框的内容
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <Button type="secondary" onClick={() => setModalOpen(false)}>取消</Button>
                                    <Button type="primary" onClick={() => setModalOpen(false)}>确定</Button>
                                </div>
                            </Modal>
                        </Card.Content>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="display">
                    <Card className="demo-card">
                        <Card.Header title="展示组件" />
                        <Card.Content>
                            <Card variant="outlined" style={{ marginBottom: '16px' }}>
                                <Card.Header title="卡片标题" subtitle="卡片副标题" />
                                <Card.Content>
                                    这是卡片的内容区域
                                </Card.Content>
                                <Card.Actions position="end">
                                    <Button type="secondary">取消</Button>
                                    <Button type="primary">确定</Button>
                                </Card.Actions>
                            </Card>

                            <div style={{ marginBottom: '16px' }}>
                                <Switch
                                    checked={switchValue}
                                    onChange={(e) => setSwitchValue(e.target.checked)}
                                    label="开关组件"
                                />
                            </div>

                            <Radio.Group
                                value="option1"
                                options={[
                                    { value: 'option1', label: '选项一' },
                                    { value: 'option2', label: '选项二' },
                                    { value: 'option3', label: '选项三' }
                                ]}
                            />
                        </Card.Content>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </div>
    );
};

export default ComponentsDemo; 