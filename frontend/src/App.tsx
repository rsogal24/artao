import './App.css'
import { Outlet } from 'react-router-dom'
import DockNav from './components/DockNav'
import Aurora from './Aurora'

function App() {
  return (
    <div className="app-container">
      <Aurora colorStops={["#1A237E", "#FADADD", "#1A237E"]} amplitude={1.0} blend={0.5} />
      <Outlet />
      <DockNav />
    </div>
  )
}

export default App
