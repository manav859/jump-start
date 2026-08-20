import React from 'react'
import { Outlet } from 'react-router-dom'
import NavigationProgress from '../components/NavigationProgress'
import ScrollToTop from '../components/ScrollToTop'

const BlankLayout = () => {
  return (
    <div>
      <NavigationProgress />
      <ScrollToTop />
      <Outlet/>
    </div>
  )
}

export default BlankLayout
