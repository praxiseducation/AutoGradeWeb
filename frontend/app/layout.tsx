import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Grow with Praxis',
  description: 'Educational technology solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold">Grow with Praxis</a>
                </div>
                <div className="flex items-center space-x-8">
                  <a href="/" className="hover:text-blue-600">Home</a>
                  <a href="/autograde" className="hover:text-blue-600">AutoGrade</a>
                  <a href="/about" className="hover:text-blue-600">About</a>
                  <a href="/contact" className="hover:text-blue-600">Contact</a>
                  <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Sign In</a>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
