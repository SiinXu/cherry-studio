import { VirtualList } from 'react-bits';

const LongList = ({ items }) => {
    return (
        <VirtualList
            itemCount={items.length}
            itemSize={50} // 每项高度
            height={400} // 可视区域高度
            width="100%"
            renderItem={({ index, style }) => (
                <div style={style}>
                    {items[index].name}
                </div>
            )}
        />
    );
};

export default LongList; 