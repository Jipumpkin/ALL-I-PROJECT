import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {Route, Routes} from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Main from '../components/Main'
import Register from '../components/Register.jsx'
import Login from '../components/Login'
import ForgotId from '../components/ForgotId'
import ForgotPassword from '../components/ForgotPassword'

function App() {
  
  return (
    <>
      <Header></Header>
      <div className="main-content">
        <Routes>
          {/* 첫 화면 */}
          <Route path='/' element={<Main />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/forgot-id' element={<ForgotId />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          {/* <Route path='/list' element={<ProductList list={data}/>}></Route>
          <Route path='/detail/:num' element={<ProductDetail list={data}/>}></Route> */}
        </Routes>
      </div>
      <Footer></Footer>
    
    </>
  )
}

export default App
