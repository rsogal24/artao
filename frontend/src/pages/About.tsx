
import CircularGallery from '../components/CircularGallery'

function About() {
  const items = [
    { image: '/IMG_8118.jpeg', text: 'RITHIK SOGAL' }
  ]
  return (
    <div className="section-content" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
      <h1 className="fade-in-top" style={{ 
        marginTop: '2rem', 
        position: 'relative', 
        zIndex: 10,
        background: 'linear-gradient(90deg, #1A237E, #FADADD, #1A237E)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>Person Behind ARTao</h1>
      <div>
        <CircularGallery items={items} bend={3} textColor="#ffffff" borderRadius={0.05} />
      </div>
    </div>
  )
}

export default About


