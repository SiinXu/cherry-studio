import React, { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data, onAction }) => {
    const processedData = useMemo(() => {
        return data.map(item => /* 复杂处理逻辑 */);
    }, [data]);

    const handleAction = useCallback((id) => {
        onAction(id);
    }, [onAction]);

    return (
    // 组件渲染
  );
}); 