import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import ContainerView from '@/components/ContainerView';

export default async function ContainerPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?error=unauthorized');
  }

  const container = await prisma.container.findFirst({
    where: {
      id: params.id,
      collection: {
        OR: [
          { userId: session.user.id },
          {
            shares: {
              some: {
                userId: session.user.id,
                accepted: true,
              },
            },
          },
        ],
      },
    },
    include: {
      collection: true,
      items: {
        include: {
          object: {
            include: {
              objectType: true,
              properties: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!container) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Utente non autorizzato
          </h1>
          <p className="text-gray-600">
            Non hai i permessi per visualizzare questo contenitore
          </p>
        </div>
      </div>
    );
  }

  return <ContainerView container={container} />;
}

