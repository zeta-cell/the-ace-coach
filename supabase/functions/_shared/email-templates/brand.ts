// Shared Hi Volley email brand tokens (inline styles only — email safe).
export const BRAND = {
  name: 'Hi Volley',
  url: 'https://hivolley.com',
  logo: 'https://hivolley.com/images/hi-volley-logo.png',
  coral: '#FF7F45',
  navy: '#131F30',
  muted: '#5B6675',
  border: '#E7E3DA',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: '0',
  padding: '24px 0',
}
export const container = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '8px 28px 28px',
  border: `1px solid ${BRAND.border}`,
  borderRadius: '18px',
}
export const logoStyle = { margin: '16px 0 28px' }
export const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: BRAND.navy,
  letterSpacing: '-0.3px',
  margin: '0 0 16px',
}
export const text = {
  fontSize: '15px',
  color: BRAND.muted,
  lineHeight: '1.6',
  margin: '0 0 22px',
}
export const button = {
  backgroundColor: BRAND.coral,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '12px',
  padding: '14px 26px',
  textDecoration: 'none',
  display: 'inline-block',
}
export const link = { color: BRAND.coral, textDecoration: 'underline' }
export const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '26px',
  letterSpacing: '4px',
  fontWeight: 'bold' as const,
  color: BRAND.navy,
  backgroundColor: '#F4EFE6',
  borderRadius: '12px',
  padding: '14px 18px',
  margin: '0 0 28px',
}
export const hr = { borderColor: BRAND.border, margin: '30px 0 16px' }
export const footer = { fontSize: '12px', color: '#9AA3AE', margin: '0' }
