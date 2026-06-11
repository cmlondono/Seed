import { Scissors } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-sidebar p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-base font-semibold text-sidebar-foreground">Panel Admin</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-sidebar-foreground leading-snug">
            Gestión integral<br />de tu negocio
          </p>
          <p className="mt-3 text-sm text-sidebar-foreground/50 leading-relaxed">
            Citas, clientes, inventario, ventas y reportes en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/30">© {new Date().getFullYear()} Panel Admin</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-6">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold">Panel Admin</span>
        </div>
        {children}
      </div>
    </div>
  );
}
