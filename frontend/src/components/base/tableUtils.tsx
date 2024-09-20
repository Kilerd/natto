import { TableColumn } from "@/stores";
import { ColumnDef } from "@tanstack/react-table";

export function columnDefsGenrator<T>(columnsDefines: TableColumn[]): ColumnDef<T>[]  {
    return columnsDefines.map((column) => {
        return {
            accessorKey: column.name,
            header: column.name,
        }
    })
}

