import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from 'react-bits';
import Layout from '../components/Layout';
import {
    Form,
    Button,
    Input,
    Select,
    DatePicker,
    Checkbox,
    Radio,
    Switch
} from '../components';

const ProjectForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'planning',
        startDate: null,
        endDate: null,
        priority: 'medium',
        isPublic: false,
        tags: [],
        notificationsEnabled: true
    });

    const menuItems = [
        { path: '/dashboard', label: '仪表盘', icon: 'dashboard' },
        { path: '/projects', label: '项目', icon: 'folder' },
        { path: '/tasks', label: '任务', icon: 'task' },
        { path: '/settings', label: '设置', icon: 'settings' }
    ];

    const statusOptions = [
        { value: 'planning', label: '计划中' },
        { value: 'inProgress', label: '进行中' },
        { value: 'completed', label: '已完成' },
        { value: 'onHold', label: '已暂停' }
    ];

    const priorityOptions = [
        { value: 'low', label: '低' },
        { value: 'medium', label: '中' },
        { value: 'high', label: '高' },
        { value: 'urgent', label: '紧急' }
    ];

    const tagOptions = [
        { value: 'design', label: '设计' },
        { value: 'development', label: '开发' },
        { value: 'marketing', label: '营销' },
        { value: 'research', label: '研究' }
    ];

    const handleChange = (field) => (value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (values) => {
        console.log('提交的表单数据:', values);
        // 处理表单提交
    };

    return (
        <Layout
            user={{ name: '张三', avatar: '/avatar.jpg' }}
            menuItems={menuItems}
            onLogout={() => console.log('退出登录')}
        >
            <h1>创建新项目</h1>

            <Card className="project-form-card">
                <CardHeader title="项目信息" />
                <CardContent>
                    <Form
                        onSubmit={handleSubmit}
                        initialValues={formData}
                        layout="vertical"
                    >
                        <Form.Item label="项目名称" name="name" required>
                            <Input
                                placeholder="请输入项目名称"
                                onChange={(e) => handleChange('name')(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="项目描述" name="description">
                            <Input
                                placeholder="请输入项目描述"
                                type="textarea"
                                rows={4}
                                onChange={(e) => handleChange('description')(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="项目状态" name="status" required>
                            <Select
                                options={statusOptions}
                                placeholder="请选择项目状态"
                                onChange={handleChange('status')}
                            />
                        </Form.Item>

                        <div className="form-row">
                            <Form.Item label="开始日期" name="startDate" required>
                                <DatePicker
                                    placeholder="请选择开始日期"
                                    onChange={handleChange('startDate')}
                                />
                            </Form.Item>

                            <Form.Item label="结束日期" name="endDate">
                                <DatePicker
                                    placeholder="请选择结束日期"
                                    onChange={handleChange('endDate')}
                                    disabledDate={(date) => date < formData.startDate}
                                />
                            </Form.Item>
                        </div>

                        <Form.Item label="优先级" name="priority" required>
                            <Radio.Group
                                options={priorityOptions}
                                onChange={(e) => handleChange('priority')(e.target.value)}
                                direction="horizontal"
                            />
                        </Form.Item>

                        <Form.Item label="标签" name="tags">
                            <Select
                                options={tagOptions}
                                placeholder="请选择标签"
                                multiple
                                onChange={handleChange('tags')}
                            />
                        </Form.Item>

                        <Form.Item name="isPublic">
                            <Checkbox
                                label="公开项目"
                                checked={formData.isPublic}
                                onChange={(e) => handleChange('isPublic')(e.target.checked)}
                            />
                        </Form.Item>

                        <Form.Item name="notificationsEnabled">
                            <Switch
                                label="启用通知"
                                checked={formData.notificationsEnabled}
                                onChange={(e) => handleChange('notificationsEnabled')(e.target.checked)}
                            />
                        </Form.Item>

                        <div className="form-actions">
                            <Button type="secondary">取消</Button>
                            <Button type="primary" htmlType="submit">创建项目</Button>
                        </div>
                    </Form>
                </CardContent>
            </Card>
        </Layout>
    );
};

export default ProjectForm; 