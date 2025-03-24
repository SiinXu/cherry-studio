import React, { forwardRef } from 'react';
import { DatePicker as RBDatePicker } from 'react-bits';
import PropTypes from 'prop-types';

const DatePicker = forwardRef(({
    label,
    value,
    onChange,
    format = 'YYYY-MM-DD',
    placeholder,
    disabled = false,
    error,
    errorMessage,
    helperText,
    disabledDate,
    minDate,
    maxDate,
    required = false,
    fullWidth = true,
    size = 'medium',
    className,
    ...props
}, ref) => {
    // 映射尺寸
    const sizeMap = {
        small: 'sm',
        medium: 'md',
        large: 'lg'
    };

    return (
        <RBDatePicker
            ref={ref}
            label={label}
            value={value}
            onChange={onChange}
            format={format}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            errorMessage={errorMessage}
            helperText={helperText}
            disabledDate={disabledDate}
            minDate={minDate}
            maxDate={maxDate}
            required={required}
            fullWidth={fullWidth}
            size={sizeMap[size]}
            className={className}
            {...props}
        />
    );
});

DatePicker.displayName = 'DatePicker';

DatePicker.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number]),
    onChange: PropTypes.func,
    format: PropTypes.string,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    errorMessage: PropTypes.string,
    helperText: PropTypes.string,
    disabledDate: PropTypes.func,
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number]),
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number]),
    required: PropTypes.bool,
    fullWidth: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    className: PropTypes.string
};

export default DatePicker; 