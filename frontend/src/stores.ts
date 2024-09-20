import { atom } from 'jotai';

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Define interfaces for table and column information
export interface TableColumn {
  name: string;
  type: string;
}

export interface Table {
    name: string;
  columns: TableColumn[];
}

// Create an atom to store the tables using a hashmap, where the key is the table name
export const tablesAtom = atom<Record<string, Table>>({});

