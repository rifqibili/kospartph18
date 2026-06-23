import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-extrabold leading-tight text-slate-800">
                    Pengaturan Profil
                </h2>
            }
        >
            <Head title="Kospart PH 18" />

            <div className="py-12 bg-slate-50/50 min-h-screen">
                <div className="mx-auto max-w-5xl space-y-8 sm:px-6 lg:px-8">
                    <div className="glass-panel p-6 shadow-sm border border-slate-200 sm:rounded-2xl sm:p-10 transition-all hover:shadow-md">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="glass-panel p-6 shadow-sm border border-slate-200 sm:rounded-2xl sm:p-10 transition-all hover:shadow-md">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="glass-panel p-6 shadow-sm border border-red-100 sm:rounded-2xl sm:p-10 transition-all hover:shadow-md bg-red-50/30">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
