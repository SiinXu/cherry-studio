import React from 'react';
import { Form, Input, Select, Button } from '../components';

// 替换原有表单
const ProjectForm = ({ initialValues, onSubmit }) => {
    return (
        <Form
            layout="vertical"
            initialValues={initialValues}
            onFinish={onSubmit}
        >
            <Form.Item
                label="项目名称"
                name="name"
                rules={[{ required: true, message: '请输入项目名称' }]}
            >
                <Input placeholder="请输入项目名称" />
            </Form.Item>

            <Form.Item
                label="项目类型"
                name="type"
            >
                <Select
                    options={[
                        { value: 'web', label: '网站开发' },
                        { value: 'mobile', label: '移动应用' },
                        { value: 'design', label: 'UI设计' }
                    ]}
                    placeholder="请选择项目类型"
                />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit">提交</Button>
                <Button style={{ marginLeft: 8 }}>取消</Button>
            </Form.Item>
        </Form>
    );
};

export default ProjectForm; 