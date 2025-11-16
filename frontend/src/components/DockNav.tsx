import { useNavigate, useLocation } from 'react-router-dom'
import Dock from './Dock'
import { useEffect } from 'react'

function DockNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { icon: <img src="/home.png" alt="Home" />, label: 'Home', onClick: () => navigate('/') },
    { icon: <img src="/people.png" alt="People" />, label: 'People', onClick: () => navigate('/about') },
    { icon: <img src="/info.png" alt="Tutorial" />, label: 'Tutorial', onClick: () => navigate('/tutorial') },
    { icon: <img src="/swipe.png" alt="Platform" />, label: 'Platform', onClick: () => navigate('/platform') },
    { icon: <img src="/folder.png" alt="Folder" />, label: 'Library', onClick: () => navigate('/library') },
  ]

  // Align dock horizontally with the title; center to 0 when title not present
  useEffect(() => {
    const title = document.getElementById('site-title')

    const align = () => {
      // On Home, title is centered; keep dock exactly centered
      if (location.pathname === '/') {
        document.documentElement.style.setProperty('--dock-x-offset', '0px')
        return
      }
      if (!title) {
        document.documentElement.style.setProperty('--dock-x-offset', '0px')
        return
      }
      const rect = title.getBoundingClientRect()
      const viewportCenter = window.innerWidth / 2
      const titleCenter = rect.left + rect.width / 2
      const offset = Math.round(titleCenter - viewportCenter)
      document.documentElement.style.setProperty('--dock-x-offset', `${offset}px`)
    }

    align()
    // Re-align after font load for accurate text width
    // @ts-ignore
    if (document.fonts && 'ready' in document.fonts) {
      // @ts-ignore
      document.fonts.ready.then(() => align())
    }
    window.addEventListener('resize', align)
    let ro: ResizeObserver | undefined
    if (title && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => align())
      ro.observe(title)
    }
    return () => {
      window.removeEventListener('resize', align)
      ro?.disconnect()
    }
  }, [location.pathname])

  return (
    <Dock
      items={items}
      className={location.pathname === '/platform' ? 'platform' : ''}
      collapsible={false}
      distance={240}
      baseItemSize={60}
      magnification={96}
      panelHeight={88}
    />
  )
}

export default DockNav


