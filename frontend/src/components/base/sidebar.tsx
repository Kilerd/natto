import React from 'react';
import { Button } from '../ui/button';
import { useAtom } from 'jotai';
import { fetcher, tablesAtom } from '../../stores';
import useSWR from 'swr';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {

  const { data: fetchedTables, error } = useSWR('http://127.0.0.1:8000/tables', fetcher);
  
  const [tables, setTables] = useAtom(tablesAtom);

  React.useEffect(() => {
    console.log(fetchedTables);
    if (fetchedTables) {
        console.log(fetchedTables.data);
      setTables(fetchedTables.data);
    }
  }, [fetchedTables, setTables]);

  if (error) {
    console.error('Failed to load tables:', error);
  }
  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="text-xl font-semibold mb-4">Tables</h2>
      <ul className="space-y-2">
        {Object.values(tables).map((table, index) => (
          <li key={index}>
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <Link to={`/tables/${table.name}`}>
                {table.name}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;