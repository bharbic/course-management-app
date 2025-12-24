import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "./useTranslation.ts"; // Import the translation hook


// --- Type Definitions ---
interface Course {
    courseId: number;
    courseName: string;
    nparticipants: number;
    classification: string;
    department: string;
    p_group: string[];
}

// --- NEW User Type Definition ---
interface User {
    userId: number;
    firstName: string;
    lastName: string;
}

// --- Delete Confirmation Modal Component (Translated) ---

interface DeleteConfirmationModalProps {
    course: Course;
    onClose: () => void;
    onConfirm: () => void;
    isSaving: boolean;
}

const DeleteCourseModal: React.FC<DeleteConfirmationModalProps> = ({ course, onClose, onConfirm, isSaving }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 shadow-2xl w-full max-w-sm rounded-xl">
                {/* Title updated to be larger and cleaner, matching the design aesthetic */}
                <h3 className="text-2xl font-bold mb-8 text-gray-900">{t("confirmCourseDeletion")}</h3>
                <p className="mb-6 text-gray-700">
                    {t("areYouSureDeleteCourse")}: <span className="font-semibold">{course.courseName}</span>? {t("cannotBeUndone")}
                </p>
                {/* Buttons updated to be blue text links and aligned to the right */}
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
                        {isSaving ? t('deleting') : t('deleteCourse')}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Utility Type Definitions ---
type SortKeys = 'courseName' | 'classification' | 'department' | 'nparticipants';
type SortDirection = 'ascending' | 'descending';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];


// --- Course Overview Main Component ---

const CourseOverview = () => {
    const { t } = useTranslation(); // Get translation function
    const navigate = useNavigate();

    // --- Utility Functions (Redefined to access t) ---
    const formatText = (text: string) => {
        if (!text) return 'N/A';

        // Use t() for specific, user-facing keywords
        if (text.toLowerCase() === 'all') return t('all');
        if (text === 'hr') return t('hr');
        if (text === 'administration') return t('administrationKeyword');

        const parts = text.split('_');
        const formatted = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');

        let result = formatted.replace(/Net/, '.NET');
        result = result.replace(/Sap/, 'SAP');

        return result;
    };
    // --- End Utility Functions ---

    // --- Data and Loading States ---
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- User Filter States (NEW) ---
    const [showAll, setShowAll] = useState(true);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    // userId stored as string for compatibility with <select> value
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // State for Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    // --- Pagination and Sorting States ---
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: SortDirection } | null>(null);

    const API_BASE_URL = `http://localhost:8080/api/courses`; // Define base URL
    const USER_API_URL = `http://localhost:8080/api/users/all`; // NEW User URL

    // =========================================================================
    // DATA FETCHING LOGIC (STABILIZED)
    // =========================================================================

    // NEW: Fetch all users for the searchable dropdown
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(USER_API_URL);
            if (!res.ok) throw new Error('Failed to fetch user list');

            const users: User[] = await res.json();
            setAllUsers(users);

            // ⭐ FIX: Use functional update to check/set selectedUserId.
            // This prevents fetchUsers from depending on selectedUserId, breaking the cycle.
            setSelectedUserId(prevId => {
                if (prevId) return prevId; // Keep existing selection
                return users.length > 0 ? String(users[0].userId) : null;
            });

        } catch (err) {
            console.error("Error fetching users:", err);
            setError(t("failedToLoadUsers"));
        } finally {
            setLoadingUsers(false);
        }
    }, [USER_API_URL]); // Add 't' back for correctness. It is now stable.


// UPDATED: Fetch courses based on the current filter state
    const fetchCourses = useCallback(async (isAll: boolean, userId: string | null) => {
        setLoading(true);
        setError(null);

        // CRITICAL: Block fetch if in filter mode but no user is selected
        if (!isAll && !userId) {
            setAllCourses([]);
            setLoading(false);
            return;
        }

        let apiUrl: string;

        if (isAll) {
            // Correct path for ALL: {BASE}/all
            apiUrl = `${API_BASE_URL}/all`;
        } else {
            // Correct path for USER: {BASE}/user/{userId}
            apiUrl = `${API_BASE_URL}/user/${userId}`;
        }

        try {
            const res = await fetch(apiUrl);

            if (!res.ok) {
                // This is the line that throws the HTTP 404 error
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data: Course[] = await res.json();
            setAllCourses(data);
            setCurrentPage(1); // Reset pagination on new fetch
        } catch (err) {
            console.error("Failed to fetch courses:", err);
            setError(t("failedToLoadCoursesGeneric"));
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);



    useEffect(() => {

        fetchCourses(showAll, selectedUserId);
    }, [showAll, selectedUserId, fetchCourses]);


    useEffect(() => {
        if (!showAll) {

            fetchUsers();
        } else {

            setSelectedUserId(null);
        }
    }, [showAll, fetchUsers]);



    const handleDeleteClick = (course: Course) => {
        setCourseToDelete(course);
        setIsDeleteModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!courseToDelete) return;

        setIsSaving(true);
        const courseId = courseToDelete.courseId;
        const courseName = courseToDelete.courseName;

        try {
            const res = await fetch(`${API_BASE_URL}/id/${courseId}`, {
                method: "DELETE",
            });

            if (res.status === 204) {
                console.log(`Course "${courseName}" deleted successfully.`);
                // IMPORTANT: Refetch using the updated filter logic
                fetchCourses(showAll, selectedUserId);
                handleCloseModal();
            } else if (res.status === 404) {
                console.error(`Error: Course ID ${courseId} not found.`);
                setError(t("courseNotFoundID") + `: ${courseId}`);
                handleCloseModal();
            } else {
                throw new Error(`Deletion failed with status: ${res.status}`);
            }
        } catch (err) {
            console.error(err);
            setError(t("errorDeletingCourse") + `: ${courseName}.`);
        } finally {
            setIsSaving(false);
            if (!error) handleCloseModal();
        }
    };




    const sortedCourses = useMemo(() => {
        const sortableItems = [...allCourses];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] as string | number;
                const bValue = b[sortConfig.key] as string | number;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [allCourses, sortConfig]);

    const requestSort = (key: SortKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const totalPages = Math.ceil(sortedCourses.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRowsPerPage = Number(e.target.value);
        setRowsPerPage(newRowsPerPage);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getSortIndicator = (key: SortKeys) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <span className="ml-1 inline">▲</span> : <span className="ml-1 inline">▼</span>;
    };

    if (loading || (!showAll && loadingUsers)) return <div className="p-6 text-center text-xl text-blue-600">{t("loadingCourses")}</div>;
    if (error) return <div className="p-6 text-center text-xl text-red-600">{t("error")}: {error}</div>;

    const tableHeaders: { key: SortKeys | 'group' | 'actions', label: string }[] = [
        { key: 'courseName', label: t('courseName') },
        { key: 'classification', label: t('classification') },
        { key: 'department', label: t('department') },
        { key: 'group', label: t('participantGroup') },
        { key: 'nparticipants', label: t('participants') },
        { key: 'actions', label: t('actions') },
    ];


    return (
        <div className="p-6 max-w-screen-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">{t("courseOverview")}</h2>

            <div className="flex flex-col sm:flex-row sm:items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-8">
                <div className="flex items-center">
                    <label htmlFor="show-all" className="mr-3 text-lg font-medium text-gray-700">
                        {t("showAllCourses")}
                    </label>
                    <input
                        type="checkbox"
                        id="show-all"
                        checked={showAll}
                        onChange={() => setShowAll(!showAll)}
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                </div>

                {!showAll && (
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <label htmlFor="user-select" className="text-lg font-medium text-gray-700 whitespace-nowrap">
                            {t("filterByUser")}:
                        </label>
                        <select
                            id="user-select"
                            value={selectedUserId || ''}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={loadingUsers || allUsers.length === 0}
                            className="flex-grow border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 shadow-sm"
                        >
                            {loadingUsers && <option value="" disabled>{t("loadingUsers")}...</option>}
                            {allUsers.length === 0 && !loadingUsers && <option value="" disabled>{t("noUsersAvailable")}</option>}

                            {allUsers.map(user => (
                                <option key={user.userId} value={String(user.userId)}>
                                    {user.firstName} {user.lastName} (ID: {user.userId})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        {tableHeaders.map((header, index) => (
                            <th
                                key={header.key}
                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 
                                    ${index === 0 ? 'rounded-tl-xl' : ''} 
                                    ${index === tableHeaders.length - 1 ? 'rounded-tr-xl' : ''}`}
                                onClick={header.key !== 'group' && header.key !== 'actions' ? () => requestSort(header.key as SortKeys) : undefined}
                            >
                                {header.label} {getSortIndicator(header.key as SortKeys)}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCourses.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                {showAll ? t("noCoursesMatchView") : t("noCoursesForSelectedUser")}
                            </td>
                        </tr>
                    ) : (
                        paginatedCourses.map((course) => (
                            <tr key={course.courseId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    {course.courseName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatText(course.classification)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatText(course.department)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {course.p_group && course.p_group.length > 0
                                        ? course.p_group.map(g => formatText(g)).join(', ')
                                        : t('na')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {course.nparticipants}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-3">
                                    <button
                                        onClick={() => navigate(`/course_overview/${course.courseId}`)}
                                        className="text-blue-600 hover:text-blue-900 font-bold disabled:opacity-50"
                                        title={t("viewDetails")}
                                        disabled={isSaving}
                                    >
                                        🔎
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(course)}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                        title={t("deleteCourse")}
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

                <div className="flex justify-end p-2 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <label htmlFor="rows-per-page" className="text-sm text-gray-700 whitespace-nowrap">{t("rowsPerPage")}:</label>
                            <select
                                id="rows-per-page"
                                value={rowsPerPage}
                                onChange={handleRowsPerPageChange}
                                className="border rounded-md px-2 py-1 text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                            >
                                {ROWS_PER_PAGE_OPTIONS.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 whitespace-nowrap">
                                {t("page")} {currentPage} {t("of")} {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isSaving}
                                className="px-3 py-1 border rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
                            >
                                &lt;
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || totalPages === 0 || isSaving}
                                className="px-3 py-1 border rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isDeleteModalOpen && courseToDelete && (
                <DeleteCourseModal
                    course={courseToDelete}
                    onClose={handleCloseModal}
                    onConfirm={handleDeleteConfirm}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};


export default CourseOverview;
