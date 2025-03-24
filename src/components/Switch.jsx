import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Switch.css';

const Switch = forwardRef(({
    checked,
    onChange,
    label,
    disabled = false,
    size = 'medium',
    color = 'primary',
    className = '',
    ...props
}, ref) => {
    // 映射尺寸到CSS类名
    const sizeClassMap = {
        small: 'rb-switch-sm',
        medium: 'rb-switch-md',
        large: 'rb-switch-lg'
    };

    // 映射颜色到CSS类名
    const colorClassMap = {
        primary: 'rb-switch-primary',
        secondary: 'rb-switch-secondary',
        success: 'rb-switch-success',
        error: 'rb-switch-error',
        warning: 'rb-switch-warning',
        info: 'rb-switch-info'
    };

    const switchClasses = [
        'rb-switch',
        sizeClassMap[size] || 'rb-switch-md',
        colorClassMap[color] || 'rb-switch-primary',
        checked ? 'rb-switch-checked' : '',
        disabled ? 'rb-switch-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <label className={switchClasses}>
            <input
                ref={ref}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="rb-switch-input"
                {...props}
            />
            <span className="rb-switch-slider"></span>
            {label && <span className="rb-switch-label">{label}</span>}
        </label>
    );
});

Switch.displayName = 'Switch';

Switch.propTypes = {
    checked: PropTypes.bool,
    onChange: PropTypes.func,
    label: PropTypes.node,
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
    className: PropTypes.string
};

export default Switch; 