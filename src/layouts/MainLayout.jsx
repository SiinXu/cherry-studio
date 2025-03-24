import React from 'react';
import { Layout, Navigation } from '../components';

// 替换原有布局
const MainLayout = ({ children }) => {
    return (
        <Layout>
            <Layout.Header>
                <div className="main-header">
                    <div className="logo">Cherry Studio</div>
                    {/* 保留原有导航项 */}
                    <Navigation
                        items={[
                            // 使用您现有的导航项
                            { key: 'dashboard', label: '仪表盘', icon: '📊' },
                            { key: 'projects', label: '项目', icon: '📁' },
                            // 其他菜单项...
                        ]}
                        mode="horizontal"
                        theme="dark"
                    />
                </div>
            </Layout.Header>

            <Layout>
                <Layout.Sider>
                    {/* 侧边栏导航 */}
                    <Navigation
                        mode="inline"
                        theme="dark"
                        items={[
                            // 您的侧边栏菜单项...
                        ]}
                    />
                </Layout.Sider>

                <Layout.Content>
                    {children}
                </Layout.Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout; 