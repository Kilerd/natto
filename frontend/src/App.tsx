import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from './components/ui/button'
import Sidebar from './components/base/sidebar'
import { Route, Routes } from 'react-router-dom'
import Index from './routes'
import TableList from './routes/tableList'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex h-screen w-full">
        <Sidebar />



        {/* Wrap main content in React Router */}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tables/:name" element={<TableList />} />
        </Routes>
        
      </div>
    
    </>
  )
}

export default App
