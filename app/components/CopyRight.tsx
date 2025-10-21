"use client"

import { useEffect, useState } from "react"

export default function Copyright() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  return <div id="colophon" className="site-info py-3 text-xs text-fc-light text-center">COPYRIGHT © {currentYear} Tummy Tales - All rights reserved.</div>
}