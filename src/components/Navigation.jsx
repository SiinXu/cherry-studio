import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Navigation.css';

const Navigation = ({
    items = [],
    mode = 'horizontal',
    theme = 'light',
    defaultSelectedKeys = [],
    selectedKeys,
    defaultOpenKeys = [],
    openKeys,
    onSelect,
    onOpenChange,
    className = '',
    ...props
}) => {
    // 内部状态
    const [internalSelectedKeys, setInternalSelectedKeys] = useState(selectedKeys || defaultSelectedKeys);
    const [internalOpenKeys, setInternalOpenKeys] = useState(openKeys || defaultOpenKeys);

    // 处理选中项
    const handleSelect = (key, item) => {
        if (selectedKeys === undefined) {
            setInternalSelectedKeys([key]);
        }

        if (onSelect) {
            onSelect(key, item);
        }
    };

    // 处理展开项
    const handleOpenChange = (key, isOpen) => {
        let newOpenKeys;

        if (isOpen) {
            newOpenKeys = [...internalOpenKeys, key];
        } else {
            newOpenKeys = internalOpenKeys.filter(k => k !== key);
        }

        if (openKeys === undefined) {
            setInternalOpenKeys(newOpenKeys);
        }

        if (onOpenChange) {
            onOpenChange(newOpenKeys);
        }
    };

    // 渲染导航项
    const renderMenuItem = (item, parentPath = '') => {
        const { key, label, icon, disabled, children } = item;
        const itemPath = parentPath ? `${parentPath}-${key}` : key;
        const isSelected = (selectedKeys || internalSelectedKeys).includes(key);
        const isOpen = (openKeys || internalOpenKeys).includes(key);

        // 如果有子项，渲染子菜单
        if (children && children.length > 0) {
            const subMenuClasses = [
                'rb-nav-submenu',
                isOpen ? 'rb-nav-submenu-open' : '',
                isSelected ? 'rb-nav-submenu-selected' : '',
                disabled ? 'rb-nav-item-disabled' : ''
            ].filter(Boolean).join(' ');

            return (
                <li key={key} className={subMenuClasses}>
                    <div
                        className="rb-nav-submenu-title"
                        onClick={() => !disabled && handleOpenChange(key, !isOpen)}
                    >
                        {icon && <span className="rb-nav-item-icon">{icon}</span>}
                        <span className="rb-nav-item-label">{label}</span>
                        <span className={`rb-nav-submenu-arrow ${isOpen ? 'rb-nav-submenu-arrow-open' : ''}`}>
                            {mode === 'horizontal' ? '▾' : '▸'}
                        </span>
                    </div>

                    <ul className={`rb-nav-submenu-list ${mode === 'horizontal' ? 'rb-nav-submenu-popup' : ''}`}>
                        {children.map(child => renderMenuItem(child, itemPath))}
                    </ul>
                </li>
            );
        }

        // 否则渲染普通菜单项
        const menuItemClasses = [
            'rb-nav-item',
            isSelected ? 'rb-nav-item-selected' : '',
            disabled ? 'rb-nav-item-disabled' : ''
        ].filter(Boolean).join(' ');

        return (
            <li
                key={key}
                className={menuItemClasses}
                onClick={() => !disabled && handleSelect(key, item)}
            >
                {icon && <span className="rb-nav-item-icon">{icon}</span>}
                <span className="rb-nav-item-label">{label}</span>
            </li>
        );
    };

    // 组合类名
    const navClasses = [
        'rb-nav',
        `rb-nav-${mode}`,
        `rb-nav-${theme}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <ul className={navClasses} {...props}>
            {items.map(item => renderMenuItem(item))}
        </ul>
    );
};

Navigation.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.node.isRequired,
            icon: PropTypes.node,
            disabled: PropTypes.bool,
            children: PropTypes.array
        })
    ),
    mode: PropTypes.oneOf(['horizontal', 'vertical', 'inline']),
    theme: PropTypes.oneOf(['light', 'dark']),
    defaultSelectedKeys: PropTypes.arrayOf(PropTypes.string),
    selectedKeys: PropTypes.arrayOf(PropTypes.string),
    defaultOpenKeys: PropTypes.arrayOf(PropTypes.string),
    openKeys: PropTypes.arrayOf(PropTypes.string),
    onSelect: PropTypes.func,
    onOpenChange: PropTypes.func,
    className: PropTypes.string
};

export default Navigation; 