<<<<<<< HEAD
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Main from "../components/Main/Main";
import Register from "../components/Register/Register";
import Login from "../components/Login/Login";
import ForgotId from "../components/ForgotId/ForgotId";
import ForgotPassword from "../components/ForgotPassword/ForgotPassword";
=======
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {Route, Routes} from 'react-router-dom'
<<<<<<< HEAD
import Header from '../components/Header'
import Footer from '../components/Footer'
import Main from '../components/Main'
import Register from '../components/Register.jsx'
import Login from '../components/Login'
import ForgotId from '../components/ForgotId'
import ForgotPassword from '../components/ForgotPassword'
=======
import Header from '../components/Header/Header'
import Footer from '../components/Footer/Footer'
import Main from '../components/Main/Main'
import Register from '../components/Register/Register'
import Login from '../components/Login/Login'
import ForgotId from '../components/ForgotId/ForgotId'
import ForgotPassword from '../components/ForgotPassword/ForgotPassword'
import AccountD from '../components/Account/AccountD'
>>>>>>> 41e4ded4cc2be79c82fbf942ae0ef123a91edc73
>>>>>>> 7d4d4f94c24e711c364a7ae1ee91fab7629456d4

function App() {
  return (
    <>
      <Header></Header>
      <div className="main-content">
        <Routes>
          {/* 첫 화면 */}
<<<<<<< HEAD
          <Route path='/' element={<Main />} />
=======
<<<<<<< HEAD
          <Route path="/" element={<Main />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-id" element={<ForgotId />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
=======
          <Route path='/' element={<AccountD />} />
>>>>>>> 7d4d4f94c24e711c364a7ae1ee91fab7629456d4
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/forgot-id' element={<ForgotId />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/account-delete' element={<AccountD />} />
>>>>>>> 41e4ded4cc2be79c82fbf942ae0ef123a91edc73
          {/* <Route path='/list' element={<ProductList list={data}/>}></Route>
          <Route path='/detail/:num' element={<ProductDetail list={data}/>}></Route> */}
        </Routes>
      </div>
      <Footer></Footer>
    </>
  );
}

export default App;
