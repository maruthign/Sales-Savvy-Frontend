import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'
import AppRoutes from './Routes'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
