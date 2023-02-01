import{BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Offers from "./pages/Offers";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
function App() {
  return (
    <>
    <h1 className='text-2xl bg-red-50'>Hello World</h1>
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/profile" element={<Profile />}/>
        <Route path="/sign-in" element={<SignIn />}/>
        <Route path="/sign-up" element={<SignUp />}/>
        <Route path="/forgot-password" element={<ForgotPassword />}/>
        <Route path="/offers" element={<Offers />}/>

        

      </Routes>
    </Router>
    </>
  );
}

export default App;
