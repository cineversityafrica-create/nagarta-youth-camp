export default function GlowDivider() {
  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{
        height: '1px',
        background: '#301317',
      }}
    >
      {/* Always-bright glowing line */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          height: '1px',
          width: '80%',
          background: 'linear-gradient(to right, transparent 5%, rgba(251, 191, 36, 1) 50%, transparent 95%)',
          boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.5)',
        }}
      />
    </div>
  );
}
