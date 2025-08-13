import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Main from "../components/Main/Main";
import Register from "../components/Register/Register";
import Login from "../components/Login/Login";
import ForgotId from "../components/ForgotId/ForgotId";
import ForgotPassword from "../components/ForgotPassword/ForgotPassword";
import AccountD from "../components/Account/AccountD";
import Maker from "../components/Maker/Maker";
import MyAccount from "../components/MyAccount/MyAccount";
import AdoptionHistory from "../components/AdoptionHistory/AdoptionHistory";
import Intro from "../components/Intro/intro";
import NotFound from "../components/NotFound/NotFound";

function App() {
  return (
    <AuthProvider>
      <Header></Header>
      <div className="main-content">
        <Routes>
          {/* 첫 화면 */}
          <Route path="/" element={<Main />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-id" element={<ForgotId />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account-delete" element={<AccountD />} />
          <Route path="/maker" element={<Maker />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/adoption-history" element={<AdoptionHistory />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer></Footer>
    </AuthProvider>
  );
}

export default App;
