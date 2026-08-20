import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import NavigationProgress from '../components/NavigationProgress'
import ScrollToTop from '../components/ScrollToTop'
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavigationProgress />
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
