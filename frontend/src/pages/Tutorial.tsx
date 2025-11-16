import Stepper, { Step } from '../Stepper'

function Tutorial() {
  return (
    <section className="scroll-section">
      <div className="section-content">
        <h1 className="fade-in-top" style={{ 
          marginTop: '2rem',
          background: 'linear-gradient(90deg, #1A237E, #FADADD, #1A237E)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          position: 'relative', 
          zIndex: 10,
        }}>Tutorial</h1>
        <div className="tutorial-stepper-wrap">
          <Stepper initialStep={1}>
          <Step>
            <div className="step-content">
              <h3>Step 1</h3>
              <p style={{ color: '#AFD5F0' }}>Open the Platform Selection in the Dock, indicated by the Swipe Icon</p>
            </div>
          </Step>
          <Step>
            <div className="step-content">
              <h3>Step 2</h3>
              <p style={{ color: '#AFD5F0' }}>Swipe Left or Right to Choose References. If you like it swipe right, if you don't like it swipe left.</p>
            </div>
          </Step>
          <Step>
            <div className="step-content">
              <h3>Step 3</h3>
              <p style={{ color: '#AFD5F0' }}>Once you have chosen the references you like, navigate to the Library Tab To View and Select Your Final Reference.</p>
            </div>
          </Step>
          <Step>
            <div className="step-content">
              <h3>Step 4</h3>
              <p style={{ color: '#AFD5F0' }}>Now Get to Work and Create Your Chef D'oeuvre!</p>
            </div>
          </Step>
          </Stepper>
        </div>
      </div>
    </section>
  )
}

export default Tutorial


