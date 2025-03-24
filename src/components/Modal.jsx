import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import './Modal.css';

const Modal = ({
    title,
    open,
    onClose,
    children,
    size = 'medium',
    closeOnEsc = true,
    closeOnOverlayClick = true,
    animation = 'fade',
    footer,
    width,
    centered = true,
    className = '',
    ...props
}) => {
    // 处理ESC键关闭
    useEffect(() => {
        if (!open || !closeOnEsc) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, closeOnEsc, onClose]);

    // 禁止背景滚动
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // 处理点击遮罩层关闭
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    // 映射尺寸到CSS类名
    const sizeClassMap = {
        small: 'rb-modal-sm',
        medium: 'rb-modal-md',
        large: 'rb-modal-lg',
        fullscreen: 'rb-modal-fullscreen'
    };

    // 映射动画到CSS类名
    const animationClassMap = {
        fade: 'rb-modal-fade',
        slide: 'rb-modal-slide',
        zoom: 'rb-modal-zoom'
    };

    if (!open) return null;

    const modalClasses = [
        'rb-modal-content',
        sizeClassMap[size] || 'rb-modal-md',
        animationClassMap[animation] || 'rb-modal-fade',
        className
    ].filter(Boolean).join(' ');

    const modalStyle = {
        ...(width ? { width } : {}),
        ...(centered ? { margin: 'auto' } : {})
    };

    // 使用 Portal 将模态框渲染到 body 的末尾
    return ReactDOM.createPortal(
        <div className="rb-modal-overlay" onClick={handleOverlayClick}>
            <div
                className={modalClasses}
                style={modalStyle}
                onClick={(e) => e.stopPropagation()}
                {...props}
            >
                <div className="rb-modal-header">
                    <h3 className="rb-modal-title">{title}</h3>
                    <button className="rb-modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="rb-modal-body">
                    {children}
                </div>

                {footer && (
                    <div className="rb-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

// 创建子组件用于更好的结构
const ModalContent = ({ children, className = '', ...props }) => (
    <div className={`rb-modal-content-wrapper ${className}`} {...props}>
        {children}
    </div>
);

const ModalFooter = ({ children, className = '', ...props }) => (
    <div className={`rb-modal-footer-wrapper ${className}`} {...props}>
        {children}
    </div>
);

Modal.Content = ModalContent;
Modal.Footer = ModalFooter;

Modal.propTypes = {
    title: PropTypes.node,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen']),
    closeOnEsc: PropTypes.bool,
    closeOnOverlayClick: PropTypes.bool,
    animation: PropTypes.oneOf(['fade', 'slide', 'zoom']),
    footer: PropTypes.node,
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    centered: PropTypes.bool,
    className: PropTypes.string
};

ModalContent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

ModalFooter.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default Modal; 