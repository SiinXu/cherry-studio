import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

const Input = forwardRef(({
    label,
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    errorMessage,
    helperText,
    type = 'text',
    disabled = false,
    required = false,
    fullWidth = true,
    size = 'medium',
    startAdornment,
    endAdornment,
    className = '',
    ...props
}, ref) => {
    // 映射尺寸到CSS类名
    const sizeClassMap = {
        small: 'rb-input-sm',
        medium: 'rb-input-md',
        large: 'rb-input-lg'
    };

    const containerClasses = [
        'rb-input-container',
        fullWidth ? 'rb-input-fullwidth' : '',
        disabled ? 'rb-input-disabled' : '',
        error ? 'rb-input-error' : '',
        className
    ].filter(Boolean).join(' ');

    const inputClasses = [
        'rb-input',
        sizeClassMap[size] || 'rb-input-md',
        startAdornment ? 'rb-input-with-start-adornment' : '',
        endAdornment ? 'rb-input-with-end-adornment' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            {label && (
                <label className="rb-input-label">
                    {label}
                    {required && <span className="rb-input-required">*</span>}
                </label>
            )}

            <div className="rb-input-wrapper">
                {startAdornment && (
                    <div className="rb-input-adornment rb-input-start-adornment">
                        {startAdornment}
                    </div>
                )}

                <input
                    ref={ref}
                    type={type}
                    className={inputClasses}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    required={required}
                    {...props}
                />

                {endAdornment && (
                    <div className="rb-input-adornment rb-input-end-adornment">
                        {endAdornment}
                    </div>
                )}
            </div>

            {(error && errorMessage) && (
                <div className="rb-input-error-message">{errorMessage}</div>
            )}

            {helperText && !error && (
                <div className="rb-input-helper-text">{helperText}</div>
            )}
        </div>
    );
});

Input.displayName = 'Input';

Input.propTypes = {
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    error: PropTypes.bool,
    errorMessage: PropTypes.string,
    helperText: PropTypes.string,
    type: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    fullWidth: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    startAdornment: PropTypes.node,
    endAdornment: PropTypes.node,
    className: PropTypes.string
};

export default Input; 