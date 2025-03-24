import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import './Form.css';

// 创建 Form 上下文
const FormContext = createContext({});

const Form = ({
    children,
    onSubmit,
    initialValues = {},
    layout = 'vertical',
    disabled = false,
    className = '',
    ...props
}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const layoutClassMap = {
        vertical: 'rb-form-vertical',
        horizontal: 'rb-form-horizontal',
        inline: 'rb-form-inline'
    };

    const formClasses = [
        'rb-form',
        layoutClassMap[layout] || 'rb-form-vertical',
        disabled ? 'rb-form-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (onSubmit) {
            onSubmit(values, { setValues, setErrors, setTouched });
        }
    };

    const setValue = (name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const setError = (name, error) => {
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const setTouchedField = (name, isTouched = true) => {
        setTouched(prev => ({
            ...prev,
            [name]: isTouched
        }));
    };

    const contextValue = {
        values,
        errors,
        touched,
        setValue,
        setError,
        setTouched: setTouchedField,
        disabled,
        layout
    };

    return (
        <FormContext.Provider value={contextValue}>
            <form className={formClasses} onSubmit={handleSubmit} {...props}>
                {children}
            </form>
        </FormContext.Provider>
    );
};

// Form Item 组件
const FormItem = ({
    label,
    name,
    children,
    required = false,
    help,
    extra,
    validateStatus,
    className = '',
    ...props
}) => {
    const {
        values,
        errors,
        touched,
        setValue,
        setTouched,
        disabled,
        layout
    } = useContext(FormContext);

    const hasError = errors[name] && touched[name];
    const status = validateStatus || (hasError ? 'error' : '');

    const itemClasses = [
        'rb-form-item',
        status ? `rb-form-item-${status}` : '',
        className
    ].filter(Boolean).join(' ');

    // 克隆子元素以传递属性
    const childElement = React.Children.only(children);

    const childProps = {
        value: values[name] !== undefined ? values[name] : '',
        onChange: (e) => {
            // 处理不同类型的事件/值
            const newValue = e && e.target ?
                (e.target.type === 'checkbox' ? e.target.checked : e.target.value) :
                e;

            setValue(name, newValue);

            if (childElement.props.onChange) {
                childElement.props.onChange(e);
            }
        },
        onBlur: (e) => {
            setTouched(name, true);

            if (childElement.props.onBlur) {
                childElement.props.onBlur(e);
            }
        },
        disabled: disabled || childElement.props.disabled,
        name,
        required,
        error: !!hasError,
        errorMessage: errors[name]
    };

    return (
        <div className={itemClasses} {...props}>
            {label && (
                <label
                    className={`rb-form-item-label ${layout === 'horizontal' ? 'rb-form-item-label-horizontal' : ''}`}
                    htmlFor={name}
                >
                    {label}
                    {required && <span className="rb-form-item-required">*</span>}
                </label>
            )}

            <div className={`rb-form-item-control ${layout === 'horizontal' ? 'rb-form-item-control-horizontal' : ''}`}>
                {React.cloneElement(childElement, childProps)}

                {hasError && (
                    <div className="rb-form-item-error">{errors[name]}</div>
                )}

                {help && !hasError && (
                    <div className="rb-form-item-help">{help}</div>
                )}

                {extra && (
                    <div className="rb-form-item-extra">{extra}</div>
                )}
            </div>
        </div>
    );
};

// 将 FormItem 组件附加到 Form 组件
Form.Item = FormItem;

Form.propTypes = {
    children: PropTypes.node,
    onSubmit: PropTypes.func,
    initialValues: PropTypes.object,
    layout: PropTypes.oneOf(['vertical', 'horizontal', 'inline']),
    disabled: PropTypes.bool,
    className: PropTypes.string
};

FormItem.propTypes = {
    label: PropTypes.node,
    name: PropTypes.string.isRequired,
    children: PropTypes.element.isRequired,
    required: PropTypes.bool,
    help: PropTypes.node,
    extra: PropTypes.node,
    validateStatus: PropTypes.oneOf(['success', 'warning', 'error', 'validating']),
    className: PropTypes.string
};

export default Form; 