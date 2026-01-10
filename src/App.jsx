import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/dashboard"
import AdminDashboard from "./pages/adminDashboard"
// import Dashboard1 from "./pages/dashboard1"
import Login from "./pages/Login"
import ThermoSafeHome from "./pages/ThermosafeHome"
function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={
          <ThermoSafeHome/>
        } />
        <Route path="/dashboard" element={
          <Dashboard/>
        } />
       

   <Route path="/admin" element={
          <AdminDashboard/>
        } />

        <Route path="/login" element={<Login />} />
        {/* <Route path="/dashboard1" element= {<Dashboard1/>}/> */}

      </Routes>
    </BrowserRouter>
  )
}

export default App
