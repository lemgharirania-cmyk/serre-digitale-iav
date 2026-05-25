function Card({ item, onClick }) {
  return (
    <div
      onClick={() => onClick(item)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${item.color}40`,
        borderTop: `4px solid ${item.color}`,
        borderRadius: '18px',
        padding: '1rem',
        cursor: 'pointer',
        transition: '0.2s',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'white',
        }}
      >
        {item.title}
      </div>
    </div>
  )
}

export default function SalleSelector({
  serres,
  blocTechnique,
  onSelect,
}) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div>
        <h3
          style={{
            color: 'white',
            marginBottom: '1rem',
            fontSize: '18px',
          }}
        >
          Les 5 serres de recherche
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: '1rem',
          }}
        >
          {serres.map((s) => (
            <Card key={s.file} item={s} onClick={onSelect} />
          ))}
        </div>
      </div>

      <div>
        <h3
          style={{
            color: 'white',
            marginBottom: '1rem',
            fontSize: '18px',
          }}
        >
          Bloc technique
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: '1rem',
          }}
        >
          {blocTechnique.map((s) => (
            <Card key={s.file} item={s} onClick={onSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}