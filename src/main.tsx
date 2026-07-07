import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SystemProvider } from './context/SystemContext.tsx'
import { SiteContentProvider } from './context/SiteContentContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemProvider>
      <SiteContentProvider>
        <App />
      </SiteContentProvider>
    </SystemProvider>
  </StrictMode>,
)
