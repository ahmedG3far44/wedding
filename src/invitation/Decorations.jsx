export function Decoration({ name, className = '' }) {
  return <img src={`/assets/${name}.png`} className={className} alt="" loading="lazy" />;
}

export function Divider() {
  return <Decoration name="divider" className="divider" />;
}
