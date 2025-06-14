export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to Grow with Praxis</h1>
          <p className="text-xl mb-8">Innovative educational technology solutions</p>
          <a href="/autograde" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 inline-block">
            Try AutoGrade
          </a>
        </div>
      </section>
      
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Flagship Product</h2>
          <div className="bg-white shadow-lg rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">AutoGrade</h3>
            <p className="text-gray-600 mb-4">
              Revolutionary automated grading system that saves teachers hours of time.
              Scan bubble sheets and get instant digital grade records.
            </p>
            <a href="/autograde" className="text-blue-600 hover:underline">Learn more →</a>
          </div>
        </div>
      </section>
    </div>
  )
}
