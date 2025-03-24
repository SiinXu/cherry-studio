import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Tooltip.css';

const Tooltip = ({
    children,
    title,
    placement = 'top',
    arrow = true,
    trigger = 'hover',
    delay = 200,
    className = '',
    ...props
}) => {
    const [visible, setVisible] = useState(false);
    const targetRef = useRef(null);
    const tooltipRef = useRef(null);
    const timerRef = useRef(null);

    // 处理显示和隐藏
    const handleShow = () => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setVisible(true);
        }, delay);
    };

    const handleHide = () => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setVisible(false);
        }, delay);
    };

    // 处理事件绑定
    useEffect(() => {
        const target = targetRef.current;
        if (!target) return;

        if (trigger === 'hover' || trigger === 'both') {
            target.addEventListener('mouseenter', handleShow);
            target.addEventListener('mouseleave', handleHide);
        }

        if (trigger === 'click' || trigger === 'both') {
            target.addEventListener('click', () => setVisible(prev => !prev));
        }

        return () => {
            if (trigger === 'hover' || trigger === 'both') {
                target.removeEventListener('mouseenter', handleShow);
                target.removeEventListener('mouseleave', handleHide);
            }

            if (trigger === 'click' || trigger === 'both') {
                target.removeEventListener('click', () => setVisible(prev => !prev));
            }

            clearTimeout(timerRef.current);
        };
    }, [trigger, delay]);

    // 当组件挂载/更新或可见性更改时，计算位置
    useEffect(() => {
        if (visible && tooltipRef.current && targetRef.current) {
            const targetRect = targetRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            const positions = {
                top: {
                    top: targetRect.top - tooltipRect.height - 8,
                    left: targetRect.left + (targetRect.width - tooltipRect.width) / 2
                },
                bottom: {
                    top: targetRect.bottom + 8,
                    left: targetRect.left + (targetRect.width - tooltipRect.width) / 2
                },
                left: {
                    top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
                    left: targetRect.left - tooltipRect.width - 8
                },
                right: {
                    top: targetRect.top + (targetRect.height - tooltipRect.height) / 2,
                    left: targetRect.right + 8
                }
            };

            const { top, left } = positions[placement] || positions.top;

            tooltipRef.current.style.top = `${top + window.scrollY}px`;
            tooltipRef.current.style.left = `${left + window.scrollX}px`;
        }
    }, [visible, placement]);

    // 组合类名
    const tooltipClasses = [
        'rb-tooltip',
        `rb-tooltip-${placement}`,
        arrow ? 'rb-tooltip-arrow' : '',
        visible ? 'rb-tooltip-visible' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <>
            <div ref={targetRef} className="rb-tooltip-target">
                {children}
            </div>

            {visible && (
                <div
                    ref={tooltipRef}
                    className={tooltipClasses}
                    role="tooltip"
                    {...props}
                >
                    <div className="rb-tooltip-content">
                        {title}
                    </div>
                    {arrow && <div className="rb-tooltip-arrow-pointer" />}
                </div>
            )}
        </>
    );
};

Tooltip.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.node.isRequired,
    placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    arrow: PropTypes.bool,
    trigger: PropTypes.oneOf(['hover', 'click', 'both']),
    delay: PropTypes.number,
    className: PropTypes.string
};

export default Tooltip; 