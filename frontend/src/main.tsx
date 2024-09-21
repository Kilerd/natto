import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Provider } from 'jotai'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from './components/ui/sonner.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <BrowserRouter>
        <App />
        <Toaster richColors />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
