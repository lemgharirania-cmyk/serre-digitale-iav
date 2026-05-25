import { useEffect, useState } from 'react'

import GlobeIntro from './GlobeIntro'
import ViewerFrame from './ViewerFrame'
import SalleSelector from './SalleSelector'

import {
  VISITE_MODES,
  SERRES,
  BLOC_TECHNIQUE,
} from './data'

export default function SectionVisite() {
  const [activeViewer, setActiveViewer] = useState(null)
  const [openSection, setOpenSection] = useState(null)

useEffect(() => {
  function handleMessage(event) {
    if (event.data?.type !== 'agro-mode') return

    const mode = event.data.mode

    if (mode === 'auto') {
      setOpenSection('auto')

      setActiveViewer({
        title: 'Visite immersive automatique',
        file: '/walkthrough/visiteauto.html',
      })

      document
        .getElementById('viewer-section')
        ?.scrollIntoView({ behavior: 'smooth' })
    }

    if (mode === 'manual') {
      setOpenSection('manual')

      setActiveViewer({
        title: 'Visite immersive manuelle',
        file: '/walkthrough/visitemanuelle.html',
      })

      document
        .getElementById('viewer-section')
        ?.scrollIntoView({ behavior: 'smooth' })
    }

    if (mode === 'salle') {
      setOpenSection('salles')

      document
        .getElementById('salles-section')
        ?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  window.addEventListener('message', handleMessage)

  return () => {
    window.removeEventListener('message', handleMessage)
  }
}, [])

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id)
  }

  return (
    <section
      id="visite"
      style={{
        padding: '5rem 3rem',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <GlobeIntro />

        {/* MODES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {VISITE_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                toggleSection(mode.id)
                setActiveViewer(mode)
              }}
              style={{
                padding: '1.25rem',
                borderRadius: '20px',
                border: `1px solid ${mode.color}40`,
                borderTop: `4px solid ${mode.color}`,
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                {mode.title}
              </div>

              <div
                style={{
                  fontSize: '13px',
                  color: '#94A3B8',
                }}
              >
                {mode.desc}
              </div>
            </button>
          ))}

          <button
            onClick={() => toggleSection('salles')}
            style={{
              padding: '1.25rem',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderTop: '4px solid #F59E0B',
              background: 'rgba(255,255,255,0.04)',
              color: 'white',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              Exploration salle par salle
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#94A3B8',
              }}
            >
              Serres de recherche + bloc technique
            </div>
          </button>
        </div>

        {/* SALLES */}
        <div id="salles-section">
        {openSection === 'salles' && (
          <div style={{ marginBottom: '2rem' }}>
            <SalleSelector
              serres={SERRES}
              blocTechnique={BLOC_TECHNIQUE}
              onSelect={setActiveViewer}
            />
          </div>
          )}
</div>
    
        

        {/* VIEWER */}
        <div id="viewer-section">
  <ViewerFrame viewer={activeViewer} />
</div>
      </div>
    </section>
  )
}