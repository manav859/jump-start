import React from 'react'
import { Outlet } from 'react-router-dom'
import NavigationProgress from '../components/NavigationProgress'

const BlankLayout = () => {
  return (
    <div>
      <NavigationProgress />
      <Outlet/>
    </div>
  )
}

export default BlankLayout
