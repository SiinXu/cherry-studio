import React from 'react';
import PropTypes from 'prop-types';
import './Button.css'; // 确保创建这个CSS文件

const Button = ({
    children,
    onClick,
    type = 'default',
    size = 'medium',
    disabled = false,
    fullWidth = false,
    icon,
    loading = false,
    htmlType = 'button',
    className = '',
    ...props
}) => {
    // 映射类型到CSS类名
    const typeClassMap = {
        primary: 'rb-button-primary',
        secondary: 'rb-button-secondary',
        danger: 'rb-button-danger',
        success: 'rb-button-success',
        warning: 'rb-button-warning',
        info: 'rb-button-info',
        ghost: 'rb-button-ghost',
        link: 'rb-button-link'
    };

    // 映射尺寸到CSS类名
    const sizeClassMap = {
        small: 'rb-button-sm',
        medium: 'rb-button-md',
        large: 'rb-button-lg'
    };

    const buttonClasses = [
        'rb-button',
        typeClassMap[type] || 'rb-button-primary',
        sizeClassMap[size] || 'rb-button-md',
        fullWidth ? 'rb-button-fullwidth' : '',
        loading ? 'rb-button-loading' : '',
        disabled ? 'rb-button-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || loading}
            type={htmlType}
            {...props}
        >
            {icon && !loading && <span className="rb-button-icon">{icon}</span>}
            {loading && <span className="rb-button-spinner"></span>}
            {children}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'warning', 'info', 'ghost', 'link']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    fullWidth: PropTypes.bool,
    icon: PropTypes.node,
    loading: PropTypes.bool,
    htmlType: PropTypes.oneOf(['button', 'submit', 'reset']),
    className: PropTypes.string
};

export default Button; 