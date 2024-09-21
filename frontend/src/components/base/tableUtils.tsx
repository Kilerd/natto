import { ColumnType, TableColumn } from "@/stores";
import { ColumnDef, SortDirection } from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ArrowUpDown } from "lucide-react";
import { CaretDownIcon, CaretSortIcon, CaretUpIcon } from "@radix-ui/react-icons";

function getNextSortState(currentState: SortDirection | false): boolean |undefined {
    switch (currentState) {
        case "asc":
            return true;
        case "desc":
            return undefined;
        case false:
            return false;
        default:
            return false;
    }
}


export function columnDefGenrator<T>(columnsDefinition: TableColumn): ColumnDef<T> {
    console.log("columnDefGenrator", columnsDefinition);
    switch (columnsDefinition.type) {
        case ColumnType.String:
            return {
                id: columnsDefinition.name,
                accessorKey: columnsDefinition.name,
                
                header: ({ column }) => {
                    console.log("column.getIsSorted()", column.getIsSorted());
                    return (
                      <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(getNextSortState(column.getIsSorted()), true)}
                      >
                        {columnsDefinition.name.charAt(0).toUpperCase() + columnsDefinition.name.slice(1)}
                        {column.getIsSorted() === false ? <CaretSortIcon className="ml-2 h-4 w-4" /> : column.getIsSorted() === "asc" ? <CaretUpIcon className="ml-2 h-4 w-4" /> : <CaretDownIcon className="ml-2 h-4 w-4" />}
                      </Button>
                    )
                  },
                cell: ({ row }) => {
                    const value = row.getValue<any>(columnsDefinition.name);
                    return value;
                },
                enableSorting: true,
                enableHiding: true,
            }
        case ColumnType.Integer:
        case ColumnType.Float:
            return {
                id: columnsDefinition.name,
                accessorKey: columnsDefinition.name,
                header: ({ table }) => {
                    const headerText = columnsDefinition.name.charAt(0).toUpperCase() + columnsDefinition.name.slice(1);
                    return headerText;
                },
                cell: ({ row }) => {
                    const value = row.getValue<any>(columnsDefinition.name);
                    return value;
                },
                enableSorting: true,
                enableHiding: true,
            }
        case ColumnType.Boolean:
            return {
                id: columnsDefinition.name,
                accessorKey: columnsDefinition.name,
                header: ({ table }) => {
                    const headerText = columnsDefinition.name.charAt(0).toUpperCase() + columnsDefinition.name.slice(1);
                    return `${headerText}?`;
                },
                cell: ({ row }) => {
                    const value = row.getValue<boolean>(columnsDefinition.name);
                    return <Checkbox
                        checked={value}
                    />;
                },
                enableSorting: true,
                enableHiding: true,
            }
    }
}
export function columnDefsGenrator<T>(columnsDefines: TableColumn[]): ColumnDef<T>[] {
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

    return defs.concat(columnsDefines.map((column) => columnDefGenrator(column)))
}


interface ColumnTypeToCreateComponentProps {
    columnName: string;
    columnType: ColumnType;
    value: any;
    onChange: (value: any) => void;
}

export function ColumnTypeToCreateComponent({ columnName, columnType, value, onChange }: ColumnTypeToCreateComponentProps) {
    console.log("ColumnTypeToCreateComponent", columnType);
    switch (columnType) {
        case ColumnType.String:
            return (<div key={columnName} className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor={columnName}>
                    {columnName.charAt(0).toUpperCase() + columnName.slice(1)}
                </Label>
                <Input
                    id={columnName}
                    type="text"
                    className="col-span-3"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>);

        case ColumnType.Integer:
            return (<div key={columnName} className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor={columnName}>
                    {columnName.charAt(0).toUpperCase() + columnName.slice(1)}
                </Label>
                <Input
                    id={columnName}
                    type="number"
                    className="col-span-3"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                />
            </div>)
        case ColumnType.Float:
            return (<div key={columnName} className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor={columnName}>
                    {columnName.charAt(0).toUpperCase() + columnName.slice(1)}
                </Label>
                <Input
                    id={columnName}
                    type="number"
                    className="col-span-3"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                />
            </div>)


        case ColumnType.Boolean:
            return (<div key={columnName} className="flex items-center space-x-2">
                <Checkbox
                    id={columnName}
                    checked={value}
                    onCheckedChange={(checked) => onChange(checked ? true :false)}
                />
                <label
                    htmlFor={columnName}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {columnName.charAt(0).toUpperCase() + columnName.slice(1)}
                </label>
            </div>)
    }
}   