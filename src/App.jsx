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
import AllMyTicket from "./AllMyTicket/allMyT";
import AllMyP from "./MyPlainTicket/allMyP";
import TrainBooking from "./BookTrainTicket/bookTrainT";
import AllMyTrainTickets from "./MyTrainTicket/myTrainT";
import PaymentModal from "./PymetModal/pyMod";

function App() {    
  return (
    <Router>
      <Header />
      <Routes>
{/* ========== SHARED (Hamıya aid) ========== */}
<Route path="/" element={<MainPage />} />
<Route path="/login" element={<SignIn />} />
<Route path="/register" element={<Register />} />
<Route path="/email" element={<Emailcode />} />
<Route path="/forgot-pass" element={<ForgotPassword />} />
<Route path="/about" element={<About />} />

{/* ========== USER (İstifadəçi səhifələri) ========== */}
<Route path="/select-ticket" element={<SelectTicket />} />
<Route path="/show-ticket" element={<ShowTicket />} />
<Route path="/show-plane-ticket" element={<ShowPlaneTicket />} />
<Route path="/Show-Train-T" element={<ShowTrainTickets />} />
<Route path="/All-My-Train-T" element={<AllMyTrainTickets />} />
<Route path="/All-My-Tic" element={<AllMyTicket />} />
<Route path="/All-My-P" element={<AllMyP />} />
<Route path="/user-profile" element={<Profile />} />
<Route path="/Pay-Mod" element={<PaymentModal />} />
<Route path="/buy" element={<Buy />} />
<Route path="/buy-seats" element={<BuySeats />} />
<Route path="/ticket/train" element={<TrainTicket />} />
<Route path="/ticket/plane" element={<PlanetTicket />} />
<Route path="/Book-Train-T" element={<TrainBooking />} />

{/* ========== ADMIN (Admin səhifələri) ========== */}
<Route path="/create-ticket" element={<CreateTicket />} />
<Route path="/create-train-ticket" element={<CreateTrainTicket />} />
<Route path="/create-executive" element={<CreateExecutive />} />
<Route path="/Add-C-L" element={<AddCountryLocation />} />
<Route path="/Add-C" element={<AddCountry />} />
<Route path="/Add-L" element={<AddLocation />} />
<Route path="/Add-V" element={<AddVariant />} />
        <Route path="*" element={
          <div style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>
            Page Not Found
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;