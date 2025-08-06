import React from 'react'
import Content from './Content'
import './Main.css'
import ImageCompareSlider from './ImageCompareSlider'
// import './Main.css'
const Main = () => {
  return (
    <div className='main-Container'>
        <Content>
          <ImageCompareSlider></ImageCompareSlider>
        </Content>

        
    </div>
  )
}

export default Main