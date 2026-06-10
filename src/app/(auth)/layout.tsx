import { Scissors } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Scissors className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">Panel Admin</span>
      </div>
      {children}
    </div>
  );
}
