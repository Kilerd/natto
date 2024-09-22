import { SortingState } from '@tanstack/react-table';
import { atom } from 'jotai';
import { atomWithRefresh, loadable } from 'jotai/utils';

export const fetcher = (url: string) => fetch(url).then((res) => res.json());


export enum ColumnType {
    Boolean = "Boolean"     ,
    String = "String",
    Integer = "Integer",
    Float = "Float",
    Numeric = "Numeric",
}

// Define interfaces for table and column information
export interface TableColumn {
  name: string;
  type: ColumnType; 
  primary_key: boolean;
}

export interface Table {
    name: string;
    has_pk_key: boolean;
  columns: TableColumn[];
}

// Create an atom to store the tables using a hashmap, where the key is the table name
export const tablesAtom = atom<Record<string, Table>>({});





export  const tableNameAtom = atom('');
export const tablePageAtom = atom(0);
export const tableFilterAtom = atom<string | null>(null);

export const tableSortingAtom = atom<SortingState>([]);

export const tableDataFetcher = atomWithRefresh(async (get) => {
    const filter = get(tableFilterAtom);
    const response = await fetch('http://127.0.0.1:8000/retrieve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            table: get(tableNameAtom),
            page: get(tablePageAtom),
            filter: filter?.trim() === "" ? null : filter?.trim()
        }),
    });
    return (await response.json()).data;
});

export const tableDataAtom = loadable(tableDataFetcher);

