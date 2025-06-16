import './globals.css'

export const metadata = {
  title: 'AI Task Manager',
  description: 'ADHD-friendly task management with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
