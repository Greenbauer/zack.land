import { useState,useEffect} from 'react'

type MousePosition = {
  x: number
  y: number
}

export default function useMousePosition() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, false)
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [])

  return mousePosition
}