import React from 'react'
import Content from '../Content/Content'
import './Main.css'
import ImageCompareSlider from '../ImageCompareSlider/ImageCompareSlider'
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