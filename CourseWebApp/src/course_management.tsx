import { useState, useEffect } from "react";
import { useTranslation } from "./useTranslation.ts";

interface Course {
    courseId: number;
    courseName: string;
    nparticipants: number;
    classification: string;
    department: string;
    p_group: string[];
}


const DEPARTMENTS = ["java", "net", "sap", "all"];
const CLASSIFICATIONS = ["technical", "soft_skills", "business"];
const PARTICIPANT_GROUPS = ["developers", "managers", "hr", "administration"];

const CourseManagement = () => {
    const { t } = useTranslation();

    const formatText = (text: string) => {
        if (text === 'hr') return t('hr');
        if (text === 'administration') return t('administrationKeyword');
        if (text === 'developers') return t('developers');
        if (text === 'managers') return t('managers');


        if (!text) return 'N/A';
        const parts = text.split('_');
        const formatted = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');


        let result = formatted.replace(/Net/, '.NET');
        result = result.replace(/Sap/, 'SAP');

        return result;
    };

    const [filterName, setFilterName] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("");
    const [filterClassification, setFilterClassification] = useState("");


    const [courseName, setCourseName] = useState("");
    const [nParticipants, setParticipants] = useState(0);
    const [classification, setClassification] = useState("");
    const [department, setDepartment] = useState("");
    const [participantGroups, setParticipantGroups] = useState<string[]>([]);

    const [message, setMessage] = useState("");


    const [suggestions, setSuggestions] = useState<Course[]>([]);


    useEffect(() => {
        if (!filterName.trim()) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const query = new URLSearchParams();
                query.append("name", filterName);
                if (filterDepartment) query.append("department", filterDepartment);
                if (filterClassification) query.append("classification", filterClassification);

                const res = await fetch(`http://localhost:8080/api/courses/search?${query}`);
                const data: Course[] = await res.json();
                setSuggestions(data);
            } catch (err) {
                console.error(err);
                setSuggestions([]);
            }
        };

        const timeout = setTimeout(fetchSuggestions, 150);
        return () => clearTimeout(timeout);
    }, [filterName, filterDepartment, filterClassification]);

    const handleSelectCourse = (course: Course) => {
        const {
            courseName,
            nparticipants,
            classification,
            department,
            p_group
        } = course;

        setFilterName(courseName);
        setCourseName(courseName);
        setParticipants(nparticipants ?? 0);
        setClassification(classification);
        setDepartment(department);
        setParticipantGroups(p_group ?? []);
        setSuggestions([]);
    };

    const toggleGroup = (group: string) => {
        setParticipantGroups((prev) =>
            prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
        );
    };

    const handleCreate = async () => {
        setMessage("");
        try {
            const res = await fetch("http://localhost:8080/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseName: courseName,
                    nparticipants: nParticipants,
                    classification,
                    department,
                    p_group: participantGroups,
                }),
            });
            if (!res.ok) throw new Error(t("error") + ": Course already exists!"); // Basic string still needed here for API error
            setMessage(t("courseCreatedSuccess"));
        } catch (err) {
            if (err instanceof Error) setMessage(t("error") + ": " + err.message);
            else setMessage(t("error") + ": An unknown error occurred.");
        }
    };


    const handleEdit = async () => {
        if (!courseName) {
            setMessage(t("noCourseSelected"));
            return;
        }
        setMessage("");

        try {
            const encodedName = encodeURIComponent(courseName);

            const fetchRes = await fetch(`http://localhost:8080/api/courses/name/${encodedName}`);
            if (!fetchRes.ok) {
                setMessage(t("noCourseExists"));
                return;
            }
            const [oldData]: Course[] = await fetchRes.json();

            if (!oldData) {
                setMessage(t("noDataForEditing"));
                return;
            }

            const hasChanges =
                oldData.nparticipants !== nParticipants ||
                oldData.classification !== classification ||
                oldData.department !== department ||
                JSON.stringify(oldData.p_group) !== JSON.stringify(participantGroups);

            if (!hasChanges) {
                setMessage(t("noChangesMade"));
                return;
            }

            const patchRes = await fetch(`http://localhost:8080/api/courses/name/${encodedName}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    n_participants: nParticipants,
                    classification,
                    department,
                    p_group: participantGroups,
                }),
            });

            if (!patchRes.ok) throw new Error("Failed to update course");
            setMessage(t("courseUpdatedSuccess"));
        } catch (err) {
            if (err instanceof Error) setMessage(t("error") + ": " + err.message);
            else setMessage(t("error") + ": An unknown error occurred.");
        }
    };

    const handleCancel = () => {
        setCourseName("");
        setParticipants(0);
        setClassification("");
        setDepartment("");
        setParticipantGroups([]);
        setMessage("");
        setFilterName("");
        setSuggestions([]);
    };

    return (
        <div className="p-6 max-w-screen-xl mx-auto space-y-6">
            <h1 className="text-3xl font-extrabold text-gray-900">{t("courseManagementTitle")}</h1>

            <section className="bg-gray-100 p-4 rounded shadow">
                <h2 className="font-bold text-lg mb-4 text-gray-500">{t("filterTitle")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t("placeholderCourseName")}
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="border rounded px-3 py-2 w-full"
                        />
                        {suggestions.length > 0 && (
                            <ul className="absolute left-0 top-full w-full border rounded bg-white max-h-40 overflow-y-auto z-10">
                                {suggestions.map((course) => (
                                    <li
                                        key={course.courseId}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleSelectCourse(course)}
                                    >
                                        {course.courseName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">{t("selectDepartment")}</option>
                        {DEPARTMENTS.map((dep) => (
                            <option key={dep} value={dep}>
                                {formatText(dep)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterClassification}
                        onChange={(e) => setFilterClassification(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                    >
                        <option value="">{t("selectClassification")}</option>
                        {CLASSIFICATIONS.map((cls) => (
                            <option key={cls} value={cls}>
                                {formatText(cls)}
                            </option>
                        ))}
                    </select>
                </div>
            </section>


            <section className="bg-white p-4 rounded shadow">
                <h4 className="font-bold pb-2 text-gray-500">{t("basicData")}</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder={t("placeholderCourseName")}
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                    />

                    <input
                        type="number"
                        placeholder={t("placeholderParticipants")}
                        value={nParticipants || nParticipants === 0 ? nParticipants : ""}
                        onChange={(e) => setParticipants(Number(e.target.value))}
                        className="border rounded px-3 py-2 w-full"
                    />
                </div>
            </section>

            <section className="bg-white p-4 rounded shadow">
                <h3 className="font-bold pb-2 text-gray-500">{t("courseClassification")}</h3>
                {CLASSIFICATIONS.map((cls) => (
                    <label key={cls} className="mr-4">
                        <input
                            type="radio"
                            name="classification"
                            value={cls}
                            checked={classification === cls}
                            onChange={(e) => setClassification(e.target.value)}
                        />{" "}
                        {formatText(cls)}
                    </label>
                ))}
            </section>

            <section className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-2 text-gray-500">{t("departmentTitle")}</h3>
                <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                >
                    <option value="">{t("selectDepartment")}</option>
                    {DEPARTMENTS.map((dep) => (
                        <option key={dep} value={dep}>
                            {formatText(dep)}
                        </option>
                    ))}
                </select>
            </section>

            <section className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-2 text-gray-500">{t("participantGroupTitle")}</h3>
                <div className="flex flex-wrap space-x-4">
                    {PARTICIPANT_GROUPS.map((group) => (
                        <label key={group} className="block">
                            <input
                                type="checkbox"
                                checked={participantGroups.includes(group)}
                                onChange={() => toggleGroup(group)}
                            />
                            <span className="ml-2">{formatText(group)}</span>
                        </label>
                    ))}
                </div>
            </section>

            <div className="flex justify-end gap-4 pb-4">
                <button onClick={handleCreate} className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded">
                    {t("createNewCourse")}
                </button>
                <button onClick={handleEdit} className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded">
                    {t("edit")}
                </button>
                <button onClick={handleCancel} className="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded">
                    {t("cancel")}
                </button>
            </div>

            {message && <p className="mt-2 text-sm">{message}</p>}
        </div>
    );
};

export default CourseManagement;