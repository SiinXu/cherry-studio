import './Table.css'

import PropTypes from 'prop-types'
import { useState } from 'react'

const Table = ({
  data = [],
  columns = [],
  pagination = {},
  loading = false,
  bordered = false,
  striped = false,
  size = 'medium',
  onRowClick,
  onPageChange,
  onSortChange,
  className = '',
  ...props
}) => {
  const [sortField, setSortField] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [currentPage, setCurrentPage] = useState(pagination.current || 1)

  // 映射尺寸到CSS类名
  const sizeClassMap = {
    small: 'rb-table-sm',
    medium: 'rb-table-md',
    large: 'rb-table-lg'
  }

  const tableClasses = [
    'rb-table-container',
    bordered ? 'rb-table-bordered' : '',
    striped ? 'rb-table-striped' : '',
    sizeClassMap[size] || 'rb-table-md',
    loading ? 'rb-table-loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  // 处理排序
  const handleSort = (field, canSort) => {
    if (!canSort) return

    let order = 'asc'
    if (sortField === field) {
      order = sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? '' : 'asc'
    }

    setSortField(order ? field : '')
    setSortOrder(order)

    if (onSortChange) {
      onSortChange(field, order)
    }
  }

  // 处理行点击
  const handleRowClick = (record, index) => {
    if (onRowClick) {
      onRowClick(record, index)
    }
  }

  // 处理分页
  const handlePageChange = (page) => {
    setCurrentPage(page)
    if (onPageChange) {
      onPageChange(page, pagination.pageSize)
    }
  }

  // 渲染分页组件
  const renderPagination = () => {
    if (!pagination || !pagination.total) return null

    const { total, pageSize = 10, showQuickJumper = false } = pagination
    const totalPages = Math.ceil(total / pageSize)

    // 计算显示的页码范围
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, startPage + 4)

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4)
    }

    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="rb-table-pagination">
        <button className="rb-pagination-btn" disabled={currentPage === 1} onClick={() => handlePageChange(1)}>
          «
        </button>
        <button
          className="rb-pagination-btn"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}>
          ‹
        </button>

        {startPage > 1 && (
          <>
            <button className="rb-pagination-btn" onClick={() => handlePageChange(1)}>
              1
            </button>
            {startPage > 2 && <span className="rb-pagination-ellipsis">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            className={`rb-pagination-btn ${currentPage === page ? 'rb-pagination-btn-active' : ''}`}
            onClick={() => handlePageChange(page)}>
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="rb-pagination-ellipsis">...</span>}
            <button className="rb-pagination-btn" onClick={() => handlePageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        <button
          className="rb-pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}>
          ›
        </button>
        <button
          className="rb-pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}>
          »
        </button>

        {showQuickJumper && (
          <div className="rb-pagination-jumper">
            跳至
            <input
              type="number"
              min={1}
              max={totalPages}
              className="rb-pagination-jumper-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt(e.target.value, 10)
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    handlePageChange(page)
                  }
                }
              }}
            />
            页
          </div>
        )}

        <div className="rb-pagination-info">
          共 {total} 条，每页 {pageSize} 条
        </div>
      </div>
    )
  }

  // 渲染表格
  return (
    <div className={tableClasses} {...props}>
      {loading && <div className="rb-table-loading-mask">加载中...</div>}

      <div className="rb-table-wrapper">
        <table className="rb-table">
          <thead className="rb-table-header">
            <tr>
              {columns.map((column, colIndex) => (
                <th
                  key={column.key || column.dataIndex || colIndex}
                  className={`rb-table-cell ${column.sortable ? 'rb-table-column-sortable' : ''}`}
                  style={column.width ? { width: column.width } : {}}
                  onClick={() => handleSort(column.dataIndex, column.sortable)}>
                  <div className="rb-table-cell-content">
                    {column.title}

                    {column.sortable && (
                      <span className="rb-table-sort-icons">
                        <span
                          className={`rb-table-sort-icon-up ${
                            sortField === column.dataIndex && sortOrder === 'asc' ? 'rb-table-sort-icon-active' : ''
                          }`}>
                          ▲
                        </span>
                        <span
                          className={`rb-table-sort-icon-down ${
                            sortField === column.dataIndex && sortOrder === 'desc' ? 'rb-table-sort-icon-active' : ''
                          }`}>
                          ▼
                        </span>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="rb-table-body">
            {data.length > 0 ? (
              data.map((record, rowIndex) => (
                <tr
                  key={record.key || rowIndex}
                  className="rb-table-row"
                  onClick={() => handleRowClick(record, rowIndex)}>
                  {columns.map((column, colIndex) => (
                    <td key={column.key || column.dataIndex || colIndex} className="rb-table-cell">
                      {column.render
                        ? column.render(record[column.dataIndex], record, rowIndex)
                        : record[column.dataIndex]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="rb-table-empty">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}
    </div>
  )
}

Table.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.node.isRequired,
      dataIndex: PropTypes.string,
      key: PropTypes.string,
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sortable: PropTypes.bool,
      render: PropTypes.func
    })
  ),
  pagination: PropTypes.shape({
    current: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number,
    showQuickJumper: PropTypes.bool
  }),
  loading: PropTypes.bool,
  bordered: PropTypes.bool,
  striped: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onRowClick: PropTypes.func,
  onPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  className: PropTypes.string
}

export default Table
