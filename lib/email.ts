import { Resend } from 'resend'

// Lazy initialize Resend client only when needed
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendAlertEmail(
  to: string,
  alertName: string,
  listings: Array<{ title: string; price: number; url: string; source: string }>
) {
  const resend = getResendClient()
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return
  }

  const html = `
    <h2>🚗 Nueva alerta: ${alertName}</h2>
    <p>Se han encontrado ${listings.length} coches nuevos que encajan con tu búsqueda:</p>
    <ul>
      ${listings
        .map(
          (car) => `
        <li>
          <strong>${car.title}</strong><br/>
          Precio: <strong>€${car.price.toLocaleString()}</strong><br/>
          Fuente: ${car.source}<br/>
          <a href="${car.url}">Ver detalles →</a>
        </li>
      `
        )
        .join('')}
    </ul>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alerts">Ver todas tus alertas</a></p>
  `

  try {
    await resend.emails.send({
      from: 'Buscador Coches <onboarding@resend.dev>',
      to,
      subject: `🚗 ${listings.length} coches nuevos: ${alertName}`,
      html,
    })
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
