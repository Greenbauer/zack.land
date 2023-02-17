import { useEffect, useState } from "react"

type UseScroll = {
  startLimit?: number
}

export default function useScroll(options?: UseScroll) {
  const { startLimit } = options || {}
  const [isScrolling, setIsScrolling] = useState(false)

  const handleScroll = () => {
    if (window.scrollY > (startLimit || 0)) setIsScrolling(true)
    else setIsScrolling(false)
  }

  useEffect(() => {
    document.addEventListener('scroll', handleScroll)
    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  return { isScrolling }
}