import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import Header from './header.tsx'
import { LanguageProvider } from "./LanguageContext.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <LanguageProvider>
      <BrowserRouter>
          <Header />
    <App />
      </BrowserRouter>
      </LanguageProvider>
  </StrictMode>
)
