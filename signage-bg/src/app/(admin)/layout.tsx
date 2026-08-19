import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface-page)", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: "var(--sidebar-w)" }}>
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
