import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { ProfileForm } from '@/components/account/ProfileForm';

export const metadata: Metadata = {
  title: 'Профиль',
  robots: { index: false, follow: false },
};

export default function AccountProfilePage() {
  return (
    <div className="container-page pb-16 pt-10">
      <AccountShell title="Профиль">
        <ProfileForm />
      </AccountShell>
    </div>
  );
}
