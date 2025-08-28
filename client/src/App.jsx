import React from "react";
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
import AnimalDetail from '../components/AnimalDetail/AnimalDetail';
import ImageUploader from '../components/ImageUploader/ImageUploader';
import Maker from "../components/Maker/Maker";
import MakerResult from "../components/MakerResult/MakerResult";
import MyAccount from "../components/MyAccount/MyAccount";
import Intro from "../components/Intro/Intro";
import Animals from "../components/Animals/Animals";
import NotFound from "../components/NotFound/NotFound";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import ShelterMap from "../components/ShelterMap/ShelterMap";
import Admin from "../components/Admin/Admin";
import AnimalCareGame from "../components/AnimalCareGame/AnimalCareGame";
import AdoptionHistory from "../components/AdoptionHistory/AdoptionHistory";

function App() {
  return (
    <AuthProvider>
      <Header></Header>
      <div className="main-content">
        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<Main />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-id" element={<ForgotId />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/animal/:id" element={<AnimalDetail />} />
          <Route path="/image-uploader" element={<ImageUploader />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/animals" element={<Animals />} />
          <Route path="/shelter-map" element={<ShelterMap />} />
          <Route path="/care-game" element={<AnimalCareGame />} />
          
          {/* 인증이 필요한 페이지 */}
          <Route path="/maker" element={
            <ProtectedRoute>
              <Maker />
            </ProtectedRoute>
          } />
          <Route path="/maker/result" element={
            <ProtectedRoute>
              <MakerResult />
            </ProtectedRoute>
          } />
          <Route path="/my-account" element={
            <ProtectedRoute>
              <MyAccount />
            </ProtectedRoute>
          } />
          <Route path="/account-delete" element={
            <ProtectedRoute>
              <AccountD />
            </ProtectedRoute>
          } />
          <Route path="/adoption-history" element={
            <ProtectedRoute>
              <AdoptionHistory />
            </ProtectedRoute>
          } />
          
          {/* 관리자 페이지 */}
          <Route path="/admin" element={<Admin />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer></Footer>
    </AuthProvider>
  );
}

export default App;