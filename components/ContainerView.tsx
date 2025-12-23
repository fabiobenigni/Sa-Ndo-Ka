'use client';


interface ContainerViewProps {
  container: any;
}

export default function ContainerView({ container }: ContainerViewProps) {

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{container.name}</h1>
          {container.description && (
            <p className="text-gray-600 mt-1">{container.description}</p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Oggetti nel contenitore</h2>
          {container.items.length === 0 ? (
            <p className="text-gray-500">Nessun oggetto in questo contenitore</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {container.items.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  {item.object.photoUrl && (
                    <img
                      src={item.object.photoUrl}
                      alt={item.object.name}
                      className="w-full h-48 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold">{item.object.name}</h3>
                  {item.object.description && (
                    <p className="text-sm text-gray-600">{item.object.description}</p>
                  )}
                  {item.object.properties.length > 0 && (
                    <div className="mt-2">
                      {item.object.properties.map((prop: any) => (
                        <div key={prop.id} className="text-xs text-gray-500">
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

