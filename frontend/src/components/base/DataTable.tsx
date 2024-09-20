import { ColumnDef, useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, VisibilityState } from "@tanstack/react-table"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import React from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "../ui/dropdown-menu"
import { TableColumn, tableDataAtom, tableDataFetcher, tableFilterAtom } from "@/stores"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { FilterIcon } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog"
import { DialogHeader } from "../ui/dialog"
import { Label } from "../ui/label"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[],
    columnDefinitions: TableColumn[],
    tableName: string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    columnDefinitions,tableName
}: DataTableProps<TData, TValue>) {

    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            columnVisibility,
            rowSelection
        }
    })
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    
    const [tableFilter, setTableFilter] = useAtom(tableFilterAtom);
    const refreshTableData = useSetAtom(tableDataFetcher);
    const [newRecord, setNewRecord] = React.useState<Record<string, string | number>>({});

    const handleInputChange = (columnName: string, value: string) => {
        setNewRecord(prev => ({
            ...prev,
            [columnName]: columnDefinitions.find(col => col.name === columnName)?.type === 'integer'
                ? parseInt(value, 10) || 0
                : value
        }));
    };

    const resetNewRecord = () => {
        setNewRecord({});
    };

    const handleSubmit = () => {
        console.log(newRecord);
        
        fetch('http://127.0.0.1:8000/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                table: tableName,
                values: newRecord
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // You might want to refresh the table data here
            // For example, if you have a refresh function:
            // refreshTableData();
            // Close the dialog after successful creation
            setIsDialogOpen(false);
            // Refresh the table data after successful creation
            refreshTableData();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
        resetNewRecord();
    };

    console.log(columns);
    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <Input
                    value={tableFilter ?? ""}
                    placeholder="Filter by keyword..."
                    onChange={(event) =>
                        setTableFilter(event.target.value)
                    }
                    className="max-w-sm"
                />

                <div className="flex items-center gap-2">

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger> <Button className="ml-auto">
                            Create New Record
                        </Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New Record</DialogTitle>

                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                {columnDefinitions.map((column) => (
                                    <div key={column.name} className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor={column.name}>
                                            {column.name.charAt(0).toUpperCase() + column.name.slice(1)}
                                        </Label>
                                        <Input
                                            id={column.name}
                                            type={column.type === 'integer' ? 'number' : 'text'}
                                            className="col-span-3"
                                            value={newRecord[column.name] || ''}
                                            onChange={(e) => handleInputChange(column.name, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleSubmit}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>


                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns <FilterIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) => column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
