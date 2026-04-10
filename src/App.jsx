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
import SelectTicket from "./TicketSection/selectTicket";
import ShowPlaneTicket from "./ShowPlaneTicket/showPlane";
import ShowTicket from "./ShowTicket/showTicket";
import AddCountryLocation from "./AddLocCon/addLC";
import AddCountry from "./AddCountry/addC";
import AddLocation from "./AddLocation/addL";
import AddVariant from "./AddVariant/addV";
import CreateTrainTicket from "./CreateTrainTicket/createTrain";
import ShowTrainTickets from "./ShowTrainTicket/showTrain";

function App() {    
  return (
    <Router>
      <Header />
      <Routes>

        <Route path="/" element={<MainPage />} />

        {/* Auth */}
        <Route path="/login" element={<SignIn />} /> 
        <Route path="/email" element={<Emailcode />}/> 
        <Route path="/forgot-pass" element={<ForgotPassword/>} />

        {/* Ticket */}
        <Route path="/create-ticket" element={<CreateTicket/>} />
        <Route path="/create-train-ticket" element={<CreateTrainTicket/>}/>
        <Route path="/select-ticket" element={<SelectTicket/>} />
        <Route path="/show-ticket" element={<ShowTicket/>} />
        <Route path="/show-plane-ticket" element={<ShowPlaneTicket/>} />
        <Route path="/Show-Train-T" element={<ShowTrainTickets/>}/>

        {/* User */}
        <Route path="/user-profile" element={<Profile/>} />
        <Route path="/my-tickets" element={<MyTickets />} />

        {/* Buy */}
        <Route path="/buy" element={<Buy />} />
        <Route path="/buy-seats" element={<BuySeats />} />

        {/* Transport */}
        <Route path="/ticket/train" element={<TrainTicket />} />
        <Route path="/ticket/plane" element={<PlanetTicket />} />

        {/* Admin */}
        <Route path="/create-executive" element={<CreateExecutive/>}/>
        <Route path="/Add-C-L" element={<AddCountryLocation/>}/>
        <Route path="/Add-C" element={<AddCountry/>}/>
        <Route path="/Add-L" element={<AddLocation/>}/>
        <Route path="/Add-V" element={<AddVariant/>}/>

        

        {/* Other */}
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} /> 

        {/* 404 */}
        <Route path="*" element={
          <div style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>
            Səhifə tapılmadı!
          </div>
        } />

      </Routes>
    </Router>
  );
}

export default App;