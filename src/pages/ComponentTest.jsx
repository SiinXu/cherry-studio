import React, { useState } from 'react';
import {
    Button, Input, Alert, Card, Select, Checkbox, Radio, Switch,
    Tabs, Modal, Form, Tooltip, Table
} from '../components';
import '../styles/component-test.css';

const ComponentTest = () => {
    const [inputValue, setInputValue] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTab, setSelectedTab] = useState('1');

    // 表格数据
    const tableData = [
        { id: 1, name: '张三', age: 28, city: '北京' },
        { id: 2, name: '李四', age: 32, city: '上海' },
        { id: 3, name: '王五', age: 24, city: '广州' },
    ];

    const tableColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: '姓名', dataIndex: 'name', key: 'name' },
        { title: '年龄', dataIndex: 'age', key: 'age' },
        { title: '城市', dataIndex: 'city', key: 'city' },
    ];

    return (
        <div className="component-test-container">
            <h1>React Bits 组件库测试</h1>

            <Tabs activeKey={selectedTab} onChange={setSelectedTab}>
                <Tabs.TabPane tabKey="1" tab="基础组件">
                    <Card title="按钮组件" className="component-card">
                        <div className="component-row">
                            <Button>默认按钮</Button>
                            <Button type="primary">主要按钮</Button>
                            <Button type="danger">危险按钮</Button>
                            <Button type="link">链接按钮</Button>
                        </div>

                        <div className="component-row">
                            <Button size="large">大按钮</Button>
                            <Button>中等按钮</Button>
                            <Button size="small">小按钮</Button>
                        </div>

                        <div className="component-row">
                            <Button disabled>禁用按钮</Button>
                            <Button type="primary" loading>加载中</Button>
                        </div>
                    </Card>

                    <Card title="输入框组件" className="component-card">
                        <div className="component-row">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="基本输入框"
                            />
                        </div>

                        <div className="component-row">
                            <Input
                                prefix={<span>￥</span>}
                                placeholder="带前缀的输入框"
                            />
                            <Input
                                suffix={<span>RMB</span>}
                                placeholder="带后缀的输入框"
                            />
                        </div>

                        <div className="component-row">
                            <Input
                                label="带标签的输入框"
                                placeholder="请输入"
                            />
                            <Input
                                label="错误状态"
                                placeholder="请输入"
                                error="输入有误"
                            />
                        </div>
                    </Card>

                    <Card title="选择器组件" className="component-card">
                        <div className="component-row">
                            <Select
                                options={[
                                    { value: 'option1', label: '选项一' },
                                    { value: 'option2', label: '选项二' },
                                    { value: 'option3', label: '选项三' }
                                ]}
                                placeholder="请选择"
                            />
                        </div>

                        <div className="component-row">
                            <Select
                                options={[
                                    { value: 'option1', label: '选项一' },
                                    { value: 'option2', label: '选项二', disabled: true },
                                    { value: 'option3', label: '选项三' }
                                ]}
                                label="带标签的选择器"
                                placeholder="请选择"
                            />
                        </div>

                        <div className="component-row">
                            <Select
                                options={[
                                    { value: 'option1', label: '选项一' },
                                    { value: 'option2', label: '选项二' },
                                    { value: 'option3', label: '选项三' }
                                ]}
                                placeholder="多选选择器"
                                multiple
                            />
                        </div>
                    </Card>

                    <Card title="复选框和单选框" className="component-card">
                        <div className="component-row">
                            <Checkbox>默认复选框</Checkbox>
                            <Checkbox checked>选中的复选框</Checkbox>
                            <Checkbox disabled>禁用的复选框</Checkbox>
                        </div>

                        <div className="component-row">
                            <Radio.Group defaultValue="a">
                                <Radio value="a">选项A</Radio>
                                <Radio value="b">选项B</Radio>
                                <Radio value="c" disabled>选项C</Radio>
                            </Radio.Group>
                        </div>

                        <div className="component-row">
                            <Switch />
                            <Switch checked />
                            <Switch disabled />
                        </div>
                    </Card>
                </Tabs.TabPane>

                <Tabs.TabPane tabKey="2" tab="反馈组件">
                    <Card title="提示组件" className="component-card">
                        <div className="component-row">
                            <Button type="primary" onClick={() => setShowAlert(true)}>
                                显示提示
                            </Button>
                        </div>

                        {showAlert && (
                            <div className="component-row">
                                <Alert
                                    type="success"
                                    title="成功提示"
                                    message="这是一条成功消息提示"
                                    onClose={() => setShowAlert(false)}
                                />
                            </div>
                        )}

                        <div className="component-row">
                            <Alert type="info" title="信息提示" message="这是一条信息" />
                            <Alert type="warning" title="警告提示" message="这是一条警告" />
                            <Alert type="error" title="错误提示" message="这是一条错误消息" />
                        </div>
                    </Card>

                    <Card title="模态框和工具提示" className="component-card">
                        <div className="component-row">
                            <Button type="primary" onClick={() => setModalVisible(true)}>
                                打开模态框
                            </Button>

                            <Tooltip title="这是一个工具提示">
                                <Button>悬停查看提示</Button>
                            </Tooltip>
                        </div>

                        <Modal
                            title="示例模态框"
                            visible={modalVisible}
                            onClose={() => setModalVisible(false)}
                            footer={
                                <>
                                    <Button onClick={() => setModalVisible(false)}>取消</Button>
                                    <Button type="primary" onClick={() => setModalVisible(false)}>
                                        确定
                                    </Button>
                                </>
                            }
                        >
                            <p>这是模态框的内容。您可以在这里放置任何内容。</p>
                        </Modal>
                    </Card>
                </Tabs.TabPane>

                <Tabs.TabPane tabKey="3" tab="数据展示">
                    <Card title="表格组件" className="component-card">
                        <Table
                            data={tableData}
                            columns={tableColumns}
                            pagination={{ pageSize: 10, total: tableData.length }}
                        />
                    </Card>

                    <Card title="卡片组件" className="component-card">
                        <div className="cards-container">
                            <Card title="基本卡片" style={{ width: 300 }}>
                                <p>卡片内容</p>
                                <p>更多内容...</p>
                            </Card>

                            <Card
                                title="带图片的卡片"
                                style={{ width: 300 }}
                                hoverable
                            >
                                <Card.Media
                                    image="https://via.placeholder.com/300x150"
                                    height={150}
                                />
                                <Card.Content>
                                    <p>卡片内容区域</p>
                                </Card.Content>
                                <Card.Actions>
                                    <Button size="small">查看</Button>
                                    <Button size="small" type="primary">编辑</Button>
                                </Card.Actions>
                            </Card>
                        </div>
                    </Card>
                </Tabs.TabPane>

                <Tabs.TabPane tabKey="4" tab="表单">
                    <Card title="表单组件" className="component-card">
                        <Form layout="vertical" onFinish={(values) => console.log('提交:', values)}>
                            <Form.Item
                                label="用户名"
                                name="username"
                                rules={[{ required: true, message: '请输入用户名' }]}
                            >
                                <Input placeholder="请输入用户名" />
                            </Form.Item>

                            <Form.Item
                                label="密码"
                                name="password"
                                rules={[{ required: true, message: '请输入密码' }]}
                            >
                                <Input type="password" placeholder="请输入密码" />
                            </Form.Item>

                            <Form.Item
                                label="爱好"
                                name="hobbies"
                            >
                                <Checkbox.Group>
                                    <Checkbox value="reading">阅读</Checkbox>
                                    <Checkbox value="sports">运动</Checkbox>
                                    <Checkbox value="music">音乐</Checkbox>
                                </Checkbox.Group>
                            </Form.Item>

                            <Form.Item
                                label="性别"
                                name="gender"
                            >
                                <Radio.Group>
                                    <Radio value="male">男</Radio>
                                    <Radio value="female">女</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item
                                label="城市"
                                name="city"
                            >
                                <Select
                                    options={[
                                        { value: 'beijing', label: '北京' },
                                        { value: 'shanghai', label: '上海' },
                                        { value: 'guangzhou', label: '广州' }
                                    ]}
                                    placeholder="请选择城市"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit">提交</Button>
                                <Button style={{ marginLeft: 8 }}>重置</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
};

export default ComponentTest; 