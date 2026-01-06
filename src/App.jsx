import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/dashboard"
// import Dashboard1 from "./pages/dashboard1"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Dashboard/>
        } />

        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/dashboard1" element= {<Dashboard1/>}/> */}

      </Routes>
    </BrowserRouter>
  )
}

export default App
