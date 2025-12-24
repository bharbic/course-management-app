import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "./useTranslation.ts"; // Import the translation hook

const API_BASE_URL = "http://localhost:8080/api/users";

interface User {
    userId: number;
    firstName: string;
    lastName: string;
}

interface UserForm {
    firstName: string;
    lastName: string;
}


interface DeleteConfirmationModalProps {
    user: User;
    onClose: () => void;
    onConfirm: () => void;
    isSaving: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ user, onClose, onConfirm, isSaving }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 shadow-2xl w-full max-w-sm rounded-xl">
                <h3 className="text-2xl font-bold mb-8 text-gray-900">{t("confirmDeletion")}</h3>
                <p className="mb-6 text-gray-700">
                    {t("areYouSureDeleteUser")}: <span className="font-semibold">{user.firstName} {user.lastName}</span>? {t("cannotBeUndone")}
                </p>
                <div className="flex justify-end space-x-6 pt-4">
                    <button
                        onClick={onClose}
                        className="font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                        disabled={isSaving}
                    >
                        {t("cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                        disabled={isSaving}
                    >
                        {isSaving ? t('deleting') : t('deleteUser')}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface CreateEditUserModalProps {
    currentUser: User | null;
    onClose: () => void;
    onSave: (formData: UserForm) => void;
    isSaving: boolean;
}

const CreateEditUserModal: React.FC<CreateEditUserModalProps> = ({ currentUser, onClose, onSave, isSaving }) => {
    const { t } = useTranslation();

    const [form, setForm] = useState<UserForm>({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
    });
    const [validationError, setValidationError] = useState<string | null>(null);

    const isEditMode = !!currentUser;
    const title = isEditMode ? t("editUser") : t('createUser');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setValidationError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // **-- VALIDATION LOGIC (Translated) --**
        if (!form.firstName.trim() && !form.lastName.trim()) {
            setValidationError(t("requiredFirstNameAndLastName"));
        } else if (!form.firstName.trim()) {
            setValidationError(t("requiredFirstName"));
        } else if (!form.lastName.trim()) {
            setValidationError(t("requiredLastName"));
        }
        // **-- END VALIDATION LOGIC --**
        else {
            setValidationError(null);
            onSave(form);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 shadow-2xl w-full max-w-lg rounded-xl">
                <h3 className="text-2xl font-bold mb-8 text-gray-900">{title}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="flex space-x-4 mb-8">
                        <div className="flex-1">
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-b border-gray-400 bg-gray-100  focus:outline-none focus:border-blue-500"
                                required
                                disabled={isSaving}
                                placeholder={t("placeholderFirstName")}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-b border-gray-400 bg-gray-100  focus:outline-none focus:border-blue-500"
                                required
                                disabled={isSaving}
                                placeholder={t("placeholderLastName")}
                            />
                        </div>
                    </div>

                    {validationError && (
                        <div className="mb-4 text-sm font-medium text-red-600 bg-red-50 p-3 border border-red-200 rounded">
                            {validationError}
                        </div>
                    )}

                    <div className="flex justify-end space-x-6 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            className="font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Administration = () => {
    const { t } = useTranslation();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/all`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data: User[] = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            // Use translation for the console error message (if the user is viewing the console)
            console.error(t("errorLoadingUsers"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreateClick = () => {
        setCurrentUser(null);
        setIsCreateEditModalOpen(true);
    };

    const handleEditClick = (user: User) => {
        setCurrentUser(user);
        setIsCreateEditModalOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setCurrentUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsCreateEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setCurrentUser(null);
    };

    const handleSaveUser = async (formData: UserForm) => {
        setIsSaving(true);
        const method = currentUser ? 'PUT' : 'POST';
        const url = currentUser ? `${API_BASE_URL}/${currentUser.userId}` : API_BASE_URL;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error(`API save failed with status ${res.status}`);

            await fetchUsers();
            console.log(`User successfully ${currentUser ? 'updated' : 'created'}.`);
            handleCloseModals();

        } catch (error) {
            console.error(`Error saving user:`, error);
            console.error(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!currentUser) return;
        setIsSaving(true);

        try {
            const res = await fetch(`${API_BASE_URL}/${currentUser.userId}`, {
                method: 'DELETE',
            });

            if (res.status !== 204) throw new Error(`API delete failed with status ${res.status}`);

            await fetchUsers();
            console.log(`User ${currentUser.userId} deleted successfully.`);
            handleCloseModals();

        } catch (error) {
            console.error(`Error deleting user:`, error);
            console.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };


    if (loading) return <div className="p-6 text-center text-xl text-blue-600">{t("loadingUserData")}</div>;

    return (
        <div className="p-8 max-w-screen-xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">{t("administrationTitle")}</h2>

            <div className="overflow-x-auto bg-white shadow-xl rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("userId")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("firstName")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("lastName")}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button
                                onClick={handleCreateClick}
                                className="px-4 rounded-lg py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 transition shadow-md"
                                disabled={isSaving}
                            >
                                {t("createNewUser")}
                            </button>
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">{t("noUsersFound")}</td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.userId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.userId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {user.firstName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {user.lastName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-end space-x-3">
                                    <button
                                        onClick={() => handleEditClick(user)}
                                        className="text-blue-600 hover:text-blue-900 transition disabled:opacity-50"
                                        title={t("editUser")}
                                        disabled={isSaving}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(user)}
                                        className="text-red-600 hover:text-red-900 transition disabled:opacity-50"
                                        title={t("deleteUser")}
                                        disabled={isSaving}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {isCreateEditModalOpen && (
                <CreateEditUserModal
                    currentUser={currentUser}
                    onClose={handleCloseModals}
                    onSave={handleSaveUser}
                    isSaving={isSaving}
                />
            )}

            {isDeleteModalOpen && currentUser && (
                <DeleteConfirmationModal
                    user={currentUser}
                    onClose={handleCloseModals}
                    onConfirm={handleDeleteConfirm}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

export default Administration;