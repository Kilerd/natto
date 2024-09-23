import { ColumnType, TableColumn } from "@/stores";
import { ColumnDef, SortDirection } from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ArrowUpDown, CheckIcon, MoreHorizontal, PencilIcon, Trash, TrashIcon, XIcon } from "lucide-react";
import { CaretDownIcon, CaretSortIcon, CaretUpIcon } from "@radix-ui/react-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "../ui/popover";

function getNextSortState(currentState: SortDirection | false): boolean | undefined {
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
        case ColumnType.Numeric:
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

        default:
            throw new Error(`columnDefGenrator unimplemented column type: ${columnsDefinition.type}`);
    }
}
export function columnDefsGenrator<T>(columnsDefines: TableColumn[], handleDelete: (id: string) => void, onEditDialogOpen: (data: any) => void): ColumnDef<T>[] {

    const pkColumn = columnsDefines.find((column) => column.primary_key);

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

    const actionColumnDef = {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
            const rowData = row.original as any
            const pkValue: any = rowData[pkColumn?.name ?? ''];
            return (
                <>

                    {pkColumn &&
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => onEditDialogOpen(rowData)}>
                            {/* <span className="sr-only">Open menu</span> */}
                            <PencilIcon className="h-4 w-4" />
                        </Button>
                    }
                    {pkColumn && <Popover>
                        <PopoverTrigger>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                {/* <span className="sr-only">Open menu</span> */}
                                <TrashIcon className="h-4 w-4" />
                            </Button></PopoverTrigger>
                        <PopoverContent className="w-40">
                            <p className="text-sm font-semibold mb-2">Confirm delete?</p>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="icon" onClick={() => { }}><XIcon className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(pkValue)}><CheckIcon className="h-4 w-4" /></Button>
                            </div>
                        </PopoverContent>
                    </Popover>}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                {/* <span className="sr-only">Open menu</span> */}
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(pkValue)}
                            >
                                Copy payment ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View customer</DropdownMenuItem>
                            <DropdownMenuItem>View payment details</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )
        },
    } as ColumnDef<T>;


    defs = defs.concat(columnsDefines.map((column) => columnDefGenrator(column)))
    defs.push(actionColumnDef);
    return defs;
}


interface ColumnTypeToCreateComponentProps {
    columnDefinition: TableColumn;
    editMode?: boolean;
    value: any;
    onChange: (value: any) => void;
}

export function ColumnTypeToCreateComponent({ columnDefinition, value, onChange, editMode = false }: ColumnTypeToCreateComponentProps) {
    const columnName = columnDefinition.name;
    const columnType = columnDefinition.type;
    
    const isPrimaryKey = columnDefinition.primary_key;
    console.log("ColumnTypeToCreateComponent", columnDefinition);
    switch (columnType) {
        case ColumnType.String:
        case ColumnType.Numeric:
            return (<div key={columnName} className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor={columnName}>
                    {columnName.charAt(0).toUpperCase() + columnName.slice(1)}
                </Label>
                <Input
                    id={columnName}
                    type="text"
                    className="col-span-3"
                    disabled={isPrimaryKey && editMode}
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
                    disabled={isPrimaryKey && editMode}
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
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>)
        case ColumnType.Boolean:
            return (<div key={columnName} className="flex items-center space-x-2">
                <Checkbox
                    id={columnName}
                    checked={value}
                    onCheckedChange={(checked) => onChange(checked ? true : false)}
                />
                <label
                    htmlFor={columnName}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {columnName.charAt(0).toUpperCase() + columnName.slice(1)}
                </label>
            </div>)
        default:
            throw new Error(`ColumnTypeToCreateComponent unimplemented column type: ${columnType}`);
    }
}   