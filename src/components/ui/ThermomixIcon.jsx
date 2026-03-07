export default function ThermomixIcon({ size = 16, style = {} }) {
  return (
    <img
      src="/icons/thermomix.png"
      width={size}
      height={size}
      alt="Cookidoo"
      style={{ objectFit: 'contain', flexShrink: 0, ...style }}
    />
  )
}
