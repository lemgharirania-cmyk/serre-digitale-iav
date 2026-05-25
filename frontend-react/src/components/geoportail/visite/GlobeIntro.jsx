export default function GlobeIntro() {
  return (
    <div
      style={{
        borderRadius: '28px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '2rem',
      }}
    >
      <div
        style={{
          position: 'relative',
          paddingBottom: '52%',
          background: '#000',
        }}
      >
        <iframe
          src="/walkthrough/globe.html"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  )
}