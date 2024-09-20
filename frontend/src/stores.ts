import { atom } from 'jotai';

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Create an atom to store the list of table names
export const tablesAtom = atom<string[]>([
  
]);

