import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PlatformDemo from './PlatformDemo.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlatformDemo />
  </StrictMode>,
)



