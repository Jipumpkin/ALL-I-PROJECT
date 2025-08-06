import React from 'react'
import './Upload.css'
const Upload = () => {
  return (
    <div className="upload-section">
        <div
          className="upload-box upload-file-box"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, setUploadedImage1)}
        >
          {uploadedImage1 ? (
            <>
              <img src={uploadedImage1} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button className="clear-image-button" onClick={() => clearImage(setUploadedImage1)}>X</button>
            </>
          ) : (
            <>
              <p>(드래그하여 넣기)</p>
              <img src="/images/upload.png" alt="업로드 아이콘" />
              <p>또는</p>
              <button onClick={() => handleFileButtonClick(fileInputRef1)}> 파일열기</button>
            </>
          )}
          <input type="file" ref={fileInputRef1} style={{display:'none'}} onChange={(e) => handleFileChange(e, setUploadedImage1)} />
        </div>
        <div
          className="upload-box upload-file-box"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, setUploadedImage2)}
        >
          {uploadedImage2 ? (
            <>
              <img src={uploadedImage2} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button className="clear-image-button" onClick={() => clearImage(setUploadedImage2)}>X</button>
            </>
          ) : (
            <>
              <p>(드래그하여 넣기)</p>
              <img src="/images/upload.png" alt="업로드 아이콘" />
              <p>또는</p>
              <button onClick={() => handleFileButtonClick(fileInputRef2)}> 파일열기</button>
            </>
          )}
          <input type="file" ref={fileInputRef2} style={{display:'none'}} onChange={(e) => handleFileChange(e, setUploadedImage2)} />
        </div>
      </div>
  )
}

export default Upload