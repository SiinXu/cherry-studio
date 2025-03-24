import React from 'react';
import PropTypes from 'prop-types';
import './Breadcrumb.css';

const Breadcrumb = ({
    items = [],
    separator = '/',
    className = '',
    ...props
}) => {
    const breadcrumbClasses = ['rb-breadcrumb', className].filter(Boolean).join(' ');

    return (
        <nav className={breadcrumbClasses} aria-label="breadcrumb" {...props}>
            <ol className="rb-breadcrumb-list">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const { key, title, href, onClick } = item;

                    // 如果是最后一项或没有链接，则渲染为普通文本
                    const content = isLast || (!href && !onClick) ? (
                        <span className="rb-breadcrumb-text">{title}</span>
                    ) : (
                        <a
                            href={href}
                            onClick={(e) => {
                                if (onClick) {
                                    e.preventDefault();
                                    onClick(e, item);
                                }
                            }}
                            className="rb-breadcrumb-link"
                        >
                            {title}
                        </a>
                    );

                    return (
                        <li key={key || index} className={`rb-breadcrumb-item ${isLast ? 'rb-breadcrumb-item-active' : ''}`}>
                            {content}
                            {!isLast && <span className="rb-breadcrumb-separator">{separator}</span>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

Breadcrumb.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string,
            title: PropTypes.node.isRequired,
            href: PropTypes.string,
            onClick: PropTypes.func
        })
    ),
    separator: PropTypes.node,
    className: PropTypes.string
};

export default Breadcrumb; 