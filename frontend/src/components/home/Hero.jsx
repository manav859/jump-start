'use client'

import React from 'react'

import { Link } from "react-router-dom";


import icon1 from "../../assets/Scientifically-Validated.png";
import icon2 from "../../assets/Expert-Guidance.png";
import p1 from "../../assets/p1.png";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* LEFT: text */}
          <div className="lg:col-span-6">
            {/* pill */}
            <div className="mb-4 inline-block">
              <span className="rounded-full bg-teal-100/60 px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-100">
                Designed by Psychologists
              </span>
            </div>

            {/* heading */}
            <h1 className="test mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Discover Your Perfect <span style={{color: '#188B8B'}}>Career Path</span>
            </h1>

            {/* description */}
            <p className="mt-6 max-w-xl text-sm text-slate-600">
              Take scientifically-designed aptitude tests and get personalized career guidance from expert psychologists. Start your journey to a fulfilling career today.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
               <Link to="/test" className="primary-btn inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300">Start Your Test
                <svg className="ml-3 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              < Link to="/dashboard"
                className="secondary-btn inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                View Dashboard
              </Link>
            </div>

            {/* small badges */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full ">
                  {/* check icon */}
                  <img src={icon1}/>
                </span>
                <span className="text-sm font-medium text-slate-700">Scientifically Validated</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full">
                  {/* user/mentor icon */}
                  <img src={icon2} />
                </span>
                <span className="text-sm font-medium text-slate-700">Expert Guidance</span>
              </div>
            </div>
          </div>

          {/* RIGHT: card / hero visual */}
          <div className="lg:col-span-6">
            <img src={p1} className='gradient-hero'/>
          </div>
        </div>
      </div>
    </section>
  )
}
