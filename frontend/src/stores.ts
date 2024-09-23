import { SortingState } from '@tanstack/react-table';
import { atom } from 'jotai';
import { atomWithRefresh, loadable } from 'jotai/utils';

import axios from 'axios';
import { toast } from 'sonner';

export const fetcher = async (url: string) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        toast.error('An error occurred while fetching data',{
            description: error,
        });
    }

};

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
