import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppWithChatCall from './AppWithChatCall.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    {/* <AppVideo /> */}
    {/* <AppCall /> */}
    <AppWithChatCall />
  </StrictMode>,
)
