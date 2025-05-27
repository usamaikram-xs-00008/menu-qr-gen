// app/dashboard/staff/invite/page.tsx
import InviteRestaurentForm from '../../../components/InviteRestaurentForm';

export default function InviteRestaurantPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Invite Restaurant</h1>
      <InviteRestaurentForm />
    </div>
  );
}