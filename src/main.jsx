import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppVideo from './AppVideo.jsx'
import AppCall from './AppCall.jsx'
import AppWithChatCall from './AppWithChatCall.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    {/* <AppVideo /> */}
    {/* <AppCall /> */}
    <AppWithChatCall />
  </StrictMode>,
)
