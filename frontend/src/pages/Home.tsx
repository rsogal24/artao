import TypeText from '../TypeText'
import Aurora from '../Aurora'
import LogoLoop from '../components/LogoLoop'

function Home() {
  return (
    <div className="app-container" style={{ minHeight: '140vh' }}>
      <Aurora colorStops={["#1A237E", "#FADADD", "#1A237E"]} amplitude={1.0} blend={0.5} />
      <section className="landing-section">
        <div className="text-container">
          <h1 id="site-title" className="gradient-text fade-in-top">ARTao</h1>
          <TypeText
            text={["Tinder For Artist's Block","Tailored to You","AI-Driven Recommendations","User-Friendly","Discover Your Artistic Potential with CorvARTa"]}
            as="p"
            className="subtitle"
            typingSpeed={80}
            initialDelay={2000}
            showCursor={true}
            cursorCharacter="|"
            textColors={["#FADADD"]}
            loop={true}
            pauseDuration={3000}
            deletingSpeed={50}
          />
        </div>
      </section>
      <section style={{ display: 'grid', placeItems: 'center', padding: '80px 16px 160px 16px' }}>
        <LogoLoop logos={[
          { src: '/vite.svg', alt: 'Vite' },
          { src: '/react-bits-logo-BEVRCkxh.svg', alt: 'React Bits' },
          { src: '/logo-teal.png', alt: 'Logo Teal' },
          { src: '/python-logo.png', alt: 'Python' },
          { src: '/logo_dark.svg', alt: 'Logo Dark' },
          { node: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/OpenAI-white-monoblossom.svg" alt="OpenAI Blossom" style={{ height: 56, width: 'auto' }} />
              <img src="/OpenAI-white-wordmark.svg" alt="OpenAI" style={{ height: 40, width: 'auto' }} />
            </div>
          ) },
          { src: '/Official_CSS_Logo.svg.png', alt: 'CSS' },
          { src: '/ts-logo-128.png', alt: 'TypeScript' },
          
        ]} />
      </section>
    </div>
  )
}

export default Home


