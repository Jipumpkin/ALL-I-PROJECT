
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {Route, Routes} from 'react-router-dom'
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import Main from '../components/Main/Main'
import Register from '../components/Register/Register'
import Login from '../components/Login/Login'
import ForgotId from '../components/ForgotId/ForgotId'
import ForgotPassword from '../components/ForgotPassword/ForgotPassword'
import AccountD from '../components/Account/AccountD'
import AnimalDetail from '../components/AnimalDetail/AnimalDetail';
import ImageUploader from '../components/ImageUploader/ImageUploader';

function App() {
  return (
    <>
      <Header></Header>
      <div className="main-content">
        <Routes>
          {/* 첫 화면 */}
          <Route path="/" element={<Main />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-id" element={<ForgotId />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path='/account-delete' element={<AccountD />} />
          <Route path="/animal/:id" element={<AnimalDetail />} />
          <Route path="/image-uploader" element={<ImageUploader />} />
        </Routes>
      </div>
      <Footer></Footer>
    </>
  );
}

export default App;
