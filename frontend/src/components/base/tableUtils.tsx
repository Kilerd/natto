import { TableColumn } from "@/stores";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";

export function columnDefsGenrator<T>(columnsDefines: TableColumn[]): ColumnDef<T>[]  {
    let defs = [
        {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
            enableHiding: false,
        } as ColumnDef<T>,
    ];
    
    return defs.concat(columnsDefines.map((column) => {
        return {
            id: column.name,
            accessorKey: column.name,
            header: ({ table }) => {
                const headerText = column.name.charAt(0).toUpperCase() + column.name.slice(1);
                return column.type === 'integer' 
                    ? <div className="text-right">{headerText}</div>
                    : headerText;
            },
            cell: ({ row }) => {
                const value = row.getValue<any>(column.name);
                return column.type === 'integer'
                    ? <div className="text-right">{value}</div>
                    : value;
            },
            enableSorting: true,
            enableHiding: true,
        }
    }))
}
