import { tableDataAtom, tableNameAtom, tablesAtom } from '@/stores';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { columnDefsGenrator } from '@/components/base/tableUtils';
import { DataTable } from '@/components/base/DataTable';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';



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

   

    return (
        <>


            <div className="container mx-auto px-4 ">
                <div className="flex justify-between items-center py-10">
                    <h1 className="text-2xl font-bold">Table {tableName}</h1>
                </div>

                {tables[tableName]?.has_pk_key === false && (

                    <Alert className="bg-yellow-100 border-yellow-400 text-yellow-700">
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            Delete and edit functionality is disabled for this table as it does not have a primary key.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="container mx-auto">
                    <div >
                        <DataTable tableName={tableName} data={tableData.state === 'hasData' ? tableData.data : []} columnDefinitions={tables[tableName]?.columns ?? []} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default TableList;