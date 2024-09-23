import { tablesAtom } from '@/stores';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { columnDefsGenrator, ColumnTypeToCreateComponent } from '@/components/base/tableUtils';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { VisibilityState, useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, SortingState } from '@tanstack/react-table';
import { FilterIcon } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import axios from 'axios';



const TableList: React.FC = () => {
    const tables = useAtomValue(tablesAtom);

    const { name } = useParams();
    const tableName = name as string;
    console.log("table list", tableName);


    const [tablePage, setTablePage] = useState(0);
    const [tableFilter, setTableFilter] = useState<string | null>(null);
    const [tableSorting, setTableSorting] = useState<SortingState>([]);


    const [tableData, setTableData] = useState([]);


    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

    const [newRecord, setNewRecord] = React.useState<Record<string, string | number>>({});
    const [editRecord, setEditRecord] = React.useState<Record<string, any>>({});

    const handleDelete = async (id: string) => {
        console.log("deleting record", tableName, id);
        try {
            const response = await axios.post('http://127.0.0.1:8000/delete', {
                table: tableName,
                pk: id
            })
            console.log('Success:', response.data);
            toast.success(`Record deleted successfully.`)
            // todo refreshTableData();
        } catch (error) {
            console.error('Error:', error);
            toast.error(`Error on deleting record.`, {
                description: error?.response?.data.error,
                closeButton: true,
                duration: Infinity,
            })
        }
    };

    const onEditDialogOpen = (data: any) => {
        setEditRecord(data);
        setIsEditDialogOpen(true);
    }

    const columns = useMemo(() => {
        return columnDefsGenrator(tables[tableName]?.columns ?? [], handleDelete, onEditDialogOpen)
    }, [tables, tableName]);



    useEffect(() => {
        console.log("tableSorting", tableSorting);
    }, [tableSorting]);

    useEffect(() => {
        (async () => {
            try {
                const filter = tableFilter;
                const response = await axios.post('http://127.0.0.1:8000/retrieve', {
                    table: tableName,
                    page: tablePage,
                    sortings: tableSorting,
                    filter: filter?.trim() === "" ? null : filter?.trim()
                });
                setTableData(response.data.data);
            } catch (error) {
                console.log("error on fetching table data", error);
                toast.error(`Error on fetching table data.`, {
                    description: error?.response?.data.error,
                    closeButton: true,
                    duration: 5000,
                })
            }
            
        })()
    }, [tableName, tablePage, tableSorting, tableFilter]);


    const handleEditInputChange = (columnName: string, value: string) => {
        setEditRecord(prev => ({
            ...prev,
            [columnName]: value
        }));
    };

    const handleInputChange = (columnName: string, value: string) => {
        setNewRecord(prev => ({
            ...prev,
            [columnName]: value
        }));
    };

    const resetNewRecord = () => {
        setNewRecord({});
    };

    const handleSubmit = async () => {
        console.log(newRecord);
        try {
            const response = await axios.post('http://127.0.0.1:8000/create', {
                table: tableName,
                values: newRecord
            })
            console.log('Success:', response.data);
            setIsDialogOpen(false);
            toast.success(`Record created successfully.`)
            // todo refreshTableData();
        } catch (error) {
            console.log("error on creating record", error);
            toast.error(`Error on creating record.`, {
                description: error?.response?.data.error,
                closeButton: true,
                duration: Infinity,
            })
        }
        resetNewRecord();
    };



    const table = useReactTable({
        data: tableData,
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

    console.log(columns);



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
                        <div>
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Edit Record</DialogTitle>

                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        {tables[tableName]?.columns.map((column) => (
                                            <ColumnTypeToCreateComponent
                                                editMode
                                                columnDefinition={column}
                                                value={editRecord[column.name] || ''}
                                                onChange={(value) => handleEditInputChange(column.name, value)}
                                            />
                                        ))}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSubmit}>Save</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

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
                                                {tables[tableName]?.columns.map((column) => (
                                                    <ColumnTypeToCreateComponent
                                                        columnDefinition={column}
                                                        value={newRecord[column.name] || ''}
                                                        onChange={(value) => handleInputChange(column.name, value)}
                                                    />
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
                    </div>
                </div>
            </div>
        </>
    )
}

export default function TableListWrapper() {
    const { name } = useParams();
    return <TableList key={name}/>
}

