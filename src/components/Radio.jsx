import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Radio.css';

const Radio = forwardRef(({
    label,
    value,
    checked,
    onChange,
    name,
    disabled = false,
    size = 'medium',
    color = 'primary',
    className = '',
    ...props
}, ref) => {
    // 映射尺寸到CSS类名
    const sizeClassMap = {
        small: 'rb-radio-sm',
        medium: 'rb-radio-md',
        large: 'rb-radio-lg'
    };

    // 映射颜色到CSS类名
    const colorClassMap = {
        primary: 'rb-radio-primary',
        secondary: 'rb-radio-secondary',
        success: 'rb-radio-success',
        error: 'rb-radio-error',
        warning: 'rb-radio-warning',
        info: 'rb-radio-info'
    };

    const radioClasses = [
        'rb-radio',
        sizeClassMap[size] || 'rb-radio-md',
        colorClassMap[color] || 'rb-radio-primary',
        disabled ? 'rb-radio-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <label className={radioClasses}>
            <input
                ref={ref}
                type="radio"
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                name={name}
                className="rb-radio-input"
                {...props}
            />
            <span className="rb-radio-inner"></span>
            {label && <span className="rb-radio-label">{label}</span>}
        </label>
    );
});

Radio.displayName = 'Radio';

// Radio Group 组件
const RadioGroup = forwardRef(({
    name,
    value,
    onChange,
    options = [],
    direction = 'vertical',
    disabled = false,
    size = 'medium',
    color = 'primary',
    className = '',
    ...props
}, ref) => {
    const handleChange = (e) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    const groupClasses = [
        'rb-radio-group',
        `rb-radio-group-${direction}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <div ref={ref} className={groupClasses} {...props}>
            {options.map((option) => (
                <Radio
                    key={option.value}
                    name={name}
                    value={option.value}
                    label={option.label}
                    checked={value === option.value}
                    onChange={handleChange}
                    disabled={option.disabled || disabled}
                    size={size}
                    color={color}
                />
            ))}
        </div>
    );
});

RadioGroup.displayName = 'RadioGroup';

// 将 RadioGroup 组件添加到 Radio 组件
Radio.Group = RadioGroup;

Radio.propTypes = {
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    checked: PropTypes.bool,
    onChange: PropTypes.func,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
    className: PropTypes.string
};

RadioGroup.propTypes = {
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            label: PropTypes.node.isRequired,
            disabled: PropTypes.bool
        })
    ),
    direction: PropTypes.oneOf(['vertical', 'horizontal']),
    disabled: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
    className: PropTypes.string
};

export default Radio; 