'use client';


interface ContainerViewProps {
  container: any;
}

export default function ContainerView({ container }: ContainerViewProps) {

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-accent-yellow-50">
      <header className="bg-white/90 backdrop-blur-sm shadow-md border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-primary-800">{container.name}</h1>
          {container.description && (
            <p className="text-primary-700 mt-1">{container.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-primary-800">Oggetti nel contenitore</h2>
          {container.items.length === 0 ? (
            <p className="text-primary-600">Nessun oggetto in questo contenitore</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {container.items.map((item: any) => (
                <div key={item.id} className="border border-primary-200 rounded-lg p-4 bg-white/50 hover:shadow-lg transition-shadow">
                  {item.object.photoUrl && (
                    <img
                      src={item.object.photoUrl}
                      alt={item.object.name}
                      className="w-full h-48 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-primary-800">{item.object.name}</h3>
                  {item.object.description && (
                    <p className="text-sm text-primary-700">{item.object.description}</p>
                  )}
                  {item.object.properties.length > 0 && (
                    <div className="mt-2">
                      {item.object.properties.map((prop: any) => (
                        <div key={prop.id} className="text-xs text-primary-600">
                          <span className="font-medium">{prop.property.name}:</span>{' '}
                          {prop.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

