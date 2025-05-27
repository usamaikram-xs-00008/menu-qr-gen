// app/dashboard/staff/invite/page.tsx
import InviteStaffForm from '../../../components/InviteStaffForm';

export default function SuperAdminInviteStaffPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Invite Super Admin Staff</h1>
      <InviteStaffForm />
    </div>
  );
}