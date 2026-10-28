import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }) {
  return (
    <div className="space-y-6">
      <AdminNav />
      {children}
    </div>
  );
}
