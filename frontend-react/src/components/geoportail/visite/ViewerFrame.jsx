export default function ViewerFrame({ viewer }) {
  if (!viewer) {
    return (
      <div
        style={{
          borderRadius: '24px',
          padding: '5rem',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#94A3B8',
        }}
      >
        Sélectionnez un espace pour commencer l’exploration immersive.
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: '56%',
        background: '#07111F',
      }}
    >
      <iframe
        src={viewer.file}
        title={viewer.title}
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
  )
}