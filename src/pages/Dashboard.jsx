import React, { useState } from 'react';
// 从组件库导入组件
import {
    Layout,
    Navigation,
    Button,
    Card,
    Table,
    Form,
    Input,
    Select,
    Alert
} from '../components';

const Dashboard = () => {
    const [formData, setFormData] = useState({
        projectName: '',
        status: 'active',
        priority: 'medium'
    });

    const handleFormChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (values) => {
        console.log('提交的数据:', values);
        // 处理表单提交
    };

    // 项目表格数据
    const projectData = [
        { id: 1, name: '网站重构', status: '进行中', priority: '高', progress: 65 },
        { id: 2, name: 'APP设计', status: '已完成', priority: '中', progress: 100 },
        { id: 3, name: '数据分析', status: '待开始', priority: '低', progress: 0 },
    ];

    // 表格列配置
    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: '项目名称', dataIndex: 'name', key: 'name' },
        { title: '状态', dataIndex: 'status', key: 'status' },
        { title: '优先级', dataIndex: 'priority', key: 'priority' },
        {
            title: '进度',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress) => `${progress}%`
        },
        {
            title: '操作',
            key: 'actions',
            render: (_, record) => (
                <Button type="primary" size="small">查看详情</Button>
            )
        }
    ];

    // 导航菜单项
    const navItems = [
        { key: 'dashboard', label: '仪表盘', icon: '📊' },
        { key: 'projects', label: '项目管理', icon: '📁' },
        { key: 'tasks', label: '任务', icon: '✓' },
        { key: 'reports', label: '报表', icon: '📈' },
        {
            key: 'settings',
            label: '设置',
            icon: '⚙️',
            children: [
                { key: 'profile', label: '个人资料' },
                { key: 'system', label: '系统设置' }
            ]
        }
    ];

    return (
        <Layout>
            <Layout.Header>
                <div className="logo">Cherry Studio</div>
                <Navigation
                    items={navItems}
                    mode="horizontal"
                    theme="dark"
                    defaultSelectedKeys={['dashboard']}
                />
            </Layout.Header>

            <Layout>
                <Layout.Sider width={240} collapsible>
                    <Navigation
                        items={navItems}
                        mode="inline"
                        theme="dark"
                        defaultSelectedKeys={['dashboard']}
                        defaultOpenKeys={['settings']}
                    />
                </Layout.Sider>

                <Layout.Content>
                    <Alert
                        type="info"
                        title="欢迎回来"
                        message="您有3个待处理的任务需要关注"
                        closable
                    />

                    <div className="dashboard-cards">
                        <Card title="总项目数" hoverable>
                            <div className="card-value">12</div>
                            <div className="card-footer">较上月增长 20%</div>
                        </Card>

                        <Card title="完成任务" hoverable>
                            <div className="card-value">48</div>
                            <div className="card-footer">已完成总任务的 75%</div>
                        </Card>

                        <Card title="活跃用户" hoverable>
                            <div className="card-value">156</div>
                            <div className="card-footer">较上月增长 12%</div>
                        </Card>
                    </div>

                    <Card title="项目列表" extra={<Button type="primary">新建项目</Button>}>
                        <Table
                            data={projectData}
                            columns={columns}
                            pagination={{ pageSize: 10, total: projectData.length }}
                            bordered
                        />
                    </Card>

                    <Card title="添加新项目">
                        <Form layout="vertical" onFinish={handleSubmit}>
                            <Form.Item
                                label="项目名称"
                                name="projectName"
                                rules={[{ required: true, message: '请输入项目名称' }]}
                            >
                                <Input
                                    placeholder="请输入项目名称"
                                    value={formData.projectName}
                                    onChange={(e) => handleFormChange('projectName', e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item label="状态" name="status">
                                <Select
                                    options={[
                                        { value: 'active', label: '活跃' },
                                        { value: 'pending', label: '待定' },
                                        { value: 'completed', label: '已完成' }
                                    ]}
                                    value={formData.status}
                                    onChange={(value) => handleFormChange('status', value)}
                                />
                            </Form.Item>

                            <Form.Item label="优先级" name="priority">
                                <Select
                                    options={[
                                        { value: 'high', label: '高' },
                                        { value: 'medium', label: '中' },
                                        { value: 'low', label: '低' }
                                    ]}
                                    value={formData.priority}
                                    onChange={(value) => handleFormChange('priority', value)}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit">提交</Button>
                                <Button style={{ marginLeft: 8 }}>取消</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Layout.Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard; 