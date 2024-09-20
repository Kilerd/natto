import { tablesAtom } from '@/stores';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '../components/ui/table';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomWithRefresh, loadable } from 'jotai/utils';
import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { columnDefsGenrator } from '@/components/base/tableUtils';
import { DataTable } from '@/components/base/DataTable';
import { Button } from '@/components/ui/button';


export type Payment = {
    id: string
    amount: number
    status: "pending" | "processing" | "success" | "failed"
    email: string
}




const tableNameAtom = atom('');
const pageAtom = atom(0);

export const tableDataFetcher = atomWithRefresh(async (get) => {
    const response = await fetch('http://127.0.0.1:8000/retrieve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            table: get(tableNameAtom),
            page: get(pageAtom)
        }),
    });
    return await response.json();
});

export const tableDataAtom = loadable(tableDataFetcher);

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
                    {tableData.state === 'loading' && <p className="m-2">Loading...</p>}
                    {tableData.state === 'hasError' && <p className="m-2">Error loading data</p>}
                    {tableData.state === 'hasData' && (
                        <div >
                            <DataTable columns={columns} data={tableData.data} />
                        </div>
                    )}
                </div>

            </div>



        </>
    )
}

export default TableList;