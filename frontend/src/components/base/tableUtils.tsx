import { TableColumn } from "@/stores";
import { ColumnDef } from "@tanstack/react-table";

export function columnDefsGenrator<T>(columnsDefines: TableColumn[]): ColumnDef<T>[]  {
    return columnsDefines.map((column) => {
        return {
            accessorKey: column.name,
            header: () => {
                const headerText = column.name.charAt(0).toUpperCase() + column.name.slice(1);
                return column.type === 'integer' 
                    ? <div className="text-right">{headerText}</div>
                    : headerText;
            },
            cell: ({ getValue }) => {
                const value = getValue<any>();
                return column.type === 'integer'
                    ? <div className="text-right">{value}</div>
                    : value;
            },
        }
    })
}

