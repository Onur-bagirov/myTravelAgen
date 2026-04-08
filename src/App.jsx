import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./Page/MainPage";
import Header from "./Headers/Header";
import Register from "./User/Register";
import Buy from "./Buy/buy";
import PlanetTicket from "./PlainTicket/ticket";
import TrainTicket from "./TrainFolder/ticket";
import About from "./AboutPage/about"; 
import SignIn from "./SiginInPage/sign"; 
import Emailcode from "./EmailCode/Emailcode";
import CreateTicket from "./CreateTicket/ticket";
import Profile from "./UserProfile/profile";
import BuySeats from "./BuySeats/SeatMap";
import MyTickets from "./MyTickets/MyTickets";
import ForgotPassword from "./ForgotPassword/password";
import CreateExecutive from "./CreateExecutive/CreateExecutive";
import CreatePlaneTicket from "./CreateTicket/ticket";
import SelectTicket from "./TicketSection/selectTicket";
import ShowPlaneTicket from "./ShowPlaneTicket/showPlane";
import ShowTicket from "./ShowTicket/showTicket";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<MainPage />} />
        
        {/* Giriş və Təsdiqləmə */}
        <Route path="/login" element={<SignIn />} /> 
        {/* Marşrut adını digər komponentlərlə eyniləşdirdik */}
        <Route path="/email" element={<Emailcode />}/> 
        <Route path="/create-ticket" element={<CreateTicket/>} />
        <Route path="/User-Profile" element={<Profile/>} />
        <Route path="/Forgot-Pass" element={<ForgotPassword/>} />
        <Route path="/Select-Ticket" element={<SelectTicket/>} />
        <Route path="/Show-Ticket" element={<ShowTicket/>} />
        <Route path="/Create-Plane-Ticket" element={<CreatePlaneTicket/>} />
        <Route path="/Show-Plane-Ticket" element={<ShowPlaneTicket/>} />

        {/* Qeydiyyat və Digər Səhifələr */}
        <Route path="/register" element={<Register />} />
        <Route path="/buy" element={<Buy />} />
        
        <Route path="/ticket/train" element={<TrainTicket />} />
        <Route path="/ticket/plane" element={<PlanetTicket />} />

        {/* Oturacaq alma */}
        <Route path="/buy-seats" element={<BuySeats />} />
        <Route path="/MyTickets" element={<MyTickets />} />

        <Route path="/CreateExecutive" element={<CreateExecutive/>}/>

        {/* Haqqımızda səhifəsi */}
        <Route path="/about" element={<About />} /> 
        
        <Route path="*" element={<div style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>Səhifə tapılmadı!</div>} />
      </Routes>
    </Router>
  );
}

export default App;