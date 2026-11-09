export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-50 overflow-y-auto">
      {children}
    </div>
  );
}
