import styles from '@/styles/Header.module.scss'
import useMousePosition from '@/hooks/useMousePosition'

export default function NavListBackground() {
  const mousePosition = useMousePosition()

  const backgroundPosition = () => {
    const position = -1.5 * (mousePosition.x)
    if (position < -1000) return -1000
    if (position > 1000) return 1000
    return position
  }
  
  return (
    <div 
      className={styles.navListBackground} 
      style={{
        backgroundPositionX: `${ backgroundPosition() }px`,
      }}
    />
  )
}
