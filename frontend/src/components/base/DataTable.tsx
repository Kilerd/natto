import { useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, VisibilityState } from "@tanstack/react-table"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import React, { useEffect, useMemo } from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "../ui/dropdown-menu"
import { TableColumn, tableDataFetcher, tableFilterAtom, tableSortingAtom } from "@/stores"
import { useAtom, useSetAtom } from "jotai"
import { FilterIcon } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogFooter } from "../ui/dialog"
import { DialogHeader } from "../ui/dialog"
import { columnDefsGenrator, ColumnTypeToCreateComponent } from "./tableUtils"
import { toast } from "sonner"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination"

interface DataTableProps<TData, TValue> {

    data: TData[],
    columnDefinitions: TableColumn[],
    tableName: string
}

export function DataTable<TData, TValue>({
    data,
    columnDefinitions,
    tableName
}: DataTableProps<TData, TValue>) {

    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [tableSorting, setTableSorting] = useAtom(tableSortingAtom);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const [tableFilter, setTableFilter] = useAtom(tableFilterAtom);
    const [newRecord, setNewRecord] = React.useState<Record<string, string | number>>({});


    const handleDelete = (id: string) => {
        console.log("deleting record", tableName, id);
        fetch('http://127.0.0.1:8000/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                table: tableName,
                pk: id
            }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                toast.success(`Record deleted successfully.`)
                refreshTableData();
            })
            .catch((error) => {
                console.error('Error:', error);
                toast.error(`Error on deleting record.`, {
                    description: error,
                })
            });

    };

    const columns = useMemo(() => {
        return columnDefsGenrator(columnDefinitions, handleDelete)
    }, [columnDefinitions]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        // getSortedRowModel: getSortedRowModel(),
        onSortingChange: setTableSorting,
        onRowSelectionChange: setRowSelection,
        state: {
            columnVisibility,
            rowSelection,
            sorting: tableSorting
        }
    })

    useEffect(() => {
        console.log("tableSorting", tableSorting);
    }, [tableSorting]);

    const refreshTableData = useSetAtom(tableDataFetcher);


    const handleInputChange = (columnName: string, value: string) => {
        setNewRecord(prev => ({
            ...prev,
            [columnName]: value
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
                toast.success(`Record created successfully.`)
                refreshTableData();
            })
            .catch((error) => {
                toast.error(`Error on creating record.`, {
                    description: error,
                })
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
                                    <ColumnTypeToCreateComponent columnName={column.name} columnType={column.type} value={newRecord[column.name] || ''} onChange={(value) => handleInputChange(column.name, value)} />
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
                <div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink href="#">1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href="#" />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
                </div>
            </div>
        </div>
    )
}
