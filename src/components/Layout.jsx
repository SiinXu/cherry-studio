import React from 'react';
import PropTypes from 'prop-types';
import './Layout.css';

const Layout = ({ children, className = '', ...props }) => {
    const layoutClasses = ['rb-layout', className].filter(Boolean).join(' ');

    return (
        <div className={layoutClasses} {...props}>
            {children}
        </div>
    );
};

const Header = ({ children, fixed = false, className = '', ...props }) => {
    const headerClasses = [
        'rb-layout-header',
        fixed ? 'rb-layout-header-fixed' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={headerClasses} {...props}>
            {children}
        </div>
    );
};

const Sider = ({
    children,
    width = 240,
    collapsible = false,
    collapsed = false,
    onCollapse,
    collapsedWidth = 80,
    breakpoint,
    className = '',
    ...props
}) => {
    const siderWidth = collapsed ? collapsedWidth : width;

    const siderClasses = [
        'rb-layout-sider',
        collapsed ? 'rb-layout-sider-collapsed' : '',
        className
    ].filter(Boolean).join(' ');

    const handleToggle = () => {
        if (onCollapse) {
            onCollapse(!collapsed);
        }
    };

    return (
        <div
            className={siderClasses}
            style={{ width: siderWidth, minWidth: siderWidth, maxWidth: siderWidth }}
            {...props}
        >
            <div className="rb-layout-sider-children">
                {children}
            </div>

            {collapsible && (
                <div
                    className="rb-layout-sider-trigger"
                    onClick={handleToggle}
                >
                    {collapsed ? '→' : '←'}
                </div>
            )}
        </div>
    );
};

const Content = ({ children, className = '', ...props }) => {
    const contentClasses = ['rb-layout-content', className].filter(Boolean).join(' ');

    return (
        <div className={contentClasses} {...props}>
            {children}
        </div>
    );
};

const Footer = ({ children, className = '', ...props }) => {
    const footerClasses = ['rb-layout-footer', className].filter(Boolean).join(' ');

    return (
        <div className={footerClasses} {...props}>
            {children}
        </div>
    );
};

// 设置组件显示名
Header.displayName = 'Header';
Sider.displayName = 'Sider';
Content.displayName = 'Content';
Footer.displayName = 'Footer';

// 绑定子组件
Layout.Header = Header;
Layout.Sider = Sider;
Layout.Content = Content;
Layout.Footer = Footer;

// PropTypes
Layout.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

Header.propTypes = {
    children: PropTypes.node,
    fixed: PropTypes.bool,
    className: PropTypes.string
};

Sider.propTypes = {
    children: PropTypes.node,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    collapsible: PropTypes.bool,
    collapsed: PropTypes.bool,
    onCollapse: PropTypes.func,
    collapsedWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    breakpoint: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'xxl']),
    className: PropTypes.string
};

Content.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

Footer.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default Layout; 