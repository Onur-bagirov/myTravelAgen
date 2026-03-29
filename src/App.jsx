import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./Page/MainPage";
import Header from "./Headers/Header";
import Register from "./User/Register";
import Buy from "./Buy/buy";
import PlaneTicket from "./PlainTicket/ticket"; 
import TrainTicket from "./TrainFolder/ticket";
import About from "./AboutPage/about"; 
import SignIn  from "./SiginInPage/sign"; // Artıq burdadır

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<MainPage />} />
        
        {/* --- ƏLAVƏ EDİLDİ --- */}
        <Route path="/login" element={<SignIn />} /> 
        {/* --------------------- */}

        <Route path="/register" element={<Register />} />
        <Route path="/buy" element={<Buy />} />
        
        <Route path="/ticket/train" element={<TrainTicket />} />
        <Route path="/ticket/plane" element={<PlaneTicket />} />
        
        <Route path="/about" element={<About />} /> 
        
        <Route path="*" element={<div style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>Səhifə tapılmadı!</div>} />
      </Routes>
    </Router>
  );
}

export default App;