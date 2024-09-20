import { tableDataAtom, tableNameAtom, tablesAtom } from '@/stores';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { columnDefsGenrator } from '@/components/base/tableUtils';
import { DataTable } from '@/components/base/DataTable';



const TableList: React.FC = () => {
    const { name } = useParams();
    console.log("table list", name);
    const [tableName, setTableName] = useAtom(tableNameAtom);
    const tables = useAtomValue(tablesAtom);

    useEffect(() => {
        if (name) {
            console.log("setting table name", name);
            setTableName(name);
        }
    }, [name, setTableName]);
    const [tableData] = useAtom(tableDataAtom);

    const columns = useMemo(() => {
        console.log("memo generated", tables, tableName);
        return columnDefsGenrator(tables[tableName]?.columns ?? [])
    }, [tables, tableName]);

    return (
        <>
            <div className="container mx-auto px-4 ">
                <div className="flex justify-between items-center py-10">
                    <h1 className="text-2xl font-bold">Table {tableName}</h1>
                </div>
                <div className="container mx-auto">
                    <div >
                        <DataTable columns={columns} data={tableData.state === 'hasData' ? tableData.data : []} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default TableList;