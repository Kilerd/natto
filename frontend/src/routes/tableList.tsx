import { useParams } from 'react-router-dom';

const TableList: React.FC = () => {
    const { name } = useParams();

    return (
        <div>
            <h1>Table List {name}</h1>
        </div>
    )
}

export default TableList;