export function HelpBulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="help-overview__bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
