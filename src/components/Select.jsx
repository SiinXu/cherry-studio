import React, { forwardRef, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Select.css';

const Select = forwardRef(({
    label,
    options = [],
    value,
    onChange,
    placeholder,
    disabled = false,
    multiple = false,
    error,
    errorMessage,
    helperText,
    required = false,
    fullWidth = true,
    size = 'medium',
    clearable = false,
    className = '',
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);
    const dropdownRef = useRef(null);

    // 合并转发的ref和内部ref
    const handleRef = (el) => {
        selectRef.current = el;
        if (ref) {
            if (typeof ref === 'function') {
                ref(el);
            } else {
                ref.current = el;
            }
        }
    };

    // 映射尺寸到CSS类名
    const sizeClassMap = {
        small: 'rb-select-sm',
        medium: 'rb-select-md',
        large: 'rb-select-lg'
    };

    const containerClasses = [
        'rb-select-container',
        fullWidth ? 'rb-select-fullwidth' : '',
        disabled ? 'rb-select-disabled' : '',
        error ? 'rb-select-error' : '',
        isOpen ? 'rb-select-open' : '',
        className
    ].filter(Boolean).join(' ');

    const selectClasses = [
        'rb-select',
        sizeClassMap[size] || 'rb-select-md'
    ].filter(Boolean).join(' ');

    // 处理下拉菜单点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                selectRef.current &&
                !selectRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 切换下拉菜单
    const toggleDropdown = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    // 处理选项选择
    const handleSelect = (option) => {
        if (disabled) return;

        let newValue;

        if (multiple) {
            // 多选模式
            const isSelected = Array.isArray(value) && value.includes(option.value);

            if (isSelected) {
                newValue = value.filter(val => val !== option.value);
            } else {
                newValue = [...(value || []), option.value];
            }
        } else {
            // 单选模式
            newValue = option.value;
            setIsOpen(false);
        }

        if (onChange) {
            onChange(newValue);
        }
    };

    // 清除选中值
    const handleClear = (e) => {
        e.stopPropagation();
        if (disabled) return;

        const newValue = multiple ? [] : null;

        if (onChange) {
            onChange(newValue);
        }
    };

    // 获取显示文本
    const getDisplayValue = () => {
        if (!value) return '';

        if (multiple) {
            if (!Array.isArray(value) || value.length === 0) return '';

            return value.map(val => {
                const option = options.find(opt => opt.value === val);
                return option ? option.label : '';
            }).join(', ');
        } else {
            const option = options.find(opt => opt.value === value);
            return option ? option.label : '';
        }
    };

    // 检查选项是否已选中
    const isOptionSelected = (optionValue) => {
        if (multiple) {
            return Array.isArray(value) && value.includes(optionValue);
        }
        return value === optionValue;
    };

    return (
        <div className={containerClasses}>
            {label && (
                <label className="rb-select-label">
                    {label}
                    {required && <span className="rb-select-required">*</span>}
                </label>
            )}

            <div
                ref={handleRef}
                className={selectClasses}
                onClick={toggleDropdown}
                tabIndex={disabled ? -1 : 0}
            >
                <div className="rb-select-value">
                    {getDisplayValue() || (
                        <span className="rb-select-placeholder">{placeholder}</span>
                    )}
                </div>

                <div className="rb-select-actions">
                    {clearable && value && (
                        <button
                            type="button"
                            className="rb-select-clear-btn"
                            onClick={handleClear}
                        >
                            &times;
                        </button>
                    )}
                    <span className={`rb-select-arrow ${isOpen ? 'rb-select-arrow-open' : ''}`}>
                        ▼
                    </span>
                </div>
            </div>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="rb-select-dropdown"
                >
                    {options.length > 0 ? (
                        <ul className="rb-select-options">
                            {options.map((option) => (
                                <li
                                    key={option.value}
                                    className={`rb-select-option ${isOptionSelected(option.value) ? 'rb-select-option-selected' : ''
                                        } ${option.disabled ? 'rb-select-option-disabled' : ''}`}
                                    onClick={() => !option.disabled && handleSelect(option)}
                                >
                                    {multiple && (
                                        <span className="rb-select-checkbox">
                                            {isOptionSelected(option.value) && '✓'}
                                        </span>
                                    )}
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="rb-select-no-options">无选项</div>
                    )}
                </div>
            )}

            {(error && errorMessage) && (
                <div className="rb-select-error-message">{errorMessage}</div>
            )}

            {helperText && !error && (
                <div className="rb-select-helper-text">{helperText}</div>
            )}
        </div>
    );
});

Select.displayName = 'Select';

Select.propTypes = {
    label: PropTypes.string,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            label: PropTypes.node.isRequired,
            disabled: PropTypes.bool
        })
    ),
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    multiple: PropTypes.bool,
    error: PropTypes.bool,
    errorMessage: PropTypes.string,
    helperText: PropTypes.string,
    required: PropTypes.bool,
    fullWidth: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    clearable: PropTypes.bool,
    className: PropTypes.string
};

export default Select; 