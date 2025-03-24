import './Checkbox.css'

import PropTypes from 'prop-types'
import { forwardRef } from 'react'

const Checkbox = forwardRef(
  (
    {
      label,
      checked,
      onChange,
      disabled = false,
      indeterminate = false,
      size = 'medium',
      color = 'primary',
      className = '',
      ...props
    },
    ref
  ) => {
    // 映射尺寸到CSS类名
    const sizeClassMap = {
      small: 'rb-checkbox-sm',
      medium: 'rb-checkbox-md',
      large: 'rb-checkbox-lg'
    }

    // 映射颜色到CSS类名
    const colorClassMap = {
      primary: 'rb-checkbox-primary',
      secondary: 'rb-checkbox-secondary',
      success: 'rb-checkbox-success',
      error: 'rb-checkbox-error',
      warning: 'rb-checkbox-warning',
      info: 'rb-checkbox-info'
    }

    const checkboxClasses = [
      'rb-checkbox',
      sizeClassMap[size] || 'rb-checkbox-md',
      colorClassMap[color] || 'rb-checkbox-primary',
      disabled ? 'rb-checkbox-disabled' : '',
      indeterminate ? 'rb-checkbox-indeterminate' : '',
      className
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <label className={checkboxClasses}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="rb-checkbox-input"
          {...props}
        />
        <span className="rb-checkbox-inner"></span>
        {label && <span className="rb-checkbox-label">{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

Checkbox.propTypes = {
  label: PropTypes.node,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  indeterminate: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  className: PropTypes.string
}

export default Checkbox
