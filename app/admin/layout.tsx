import AdminLayoutClient from './AdminLayoutClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
    </div>
  );
}
