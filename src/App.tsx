import React from 'react'
import Navbar from './components/Navbar'
import Profile from './components/Profile'
import Myservices from "./components/Myservices"
import MyRecentWork from "./components/MyRecentWork"
import './App.css'

const App: React.FC =()=> {
  return (<>
  <div className="wrapper">
  <Navbar  name="JUMAAN.com" />
  <Profile name="Mohammed Jumaan" />
  <Myservices />
  <MyRecentWork />
  </div>
  </>)

}

export default App
