import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router";


interface Course {
    courseId: number;
    courseName: string;
    nparticipants: number;
    classification: string;
    department: string;
    p_group: string[];
}

interface User {
    userId: number;
    firstName: string;
    lastName: string;
}

interface CourseFile {
    fileId: number;
    fileName: string;
    sizeBytes: number;
    fileType: 'document' | 'photo';
    mimeType?: string;
    storagePath?: string;
}

const formatText = (text: string) => {
    if (!text) return 'N/A';
    if (text.toLowerCase() === 'all') return 'All';
    if (text === 'hr') return 'HR';
    if (text === 'administration') return 'Administration';

    const parts = text.split('_');
    const formatted = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');

    let result = formatted.replace(/Net/, '.NET');
    result = result.replace(/Sap/, 'SAP');

    return result;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CourseDetails: React.FC = () => {
    const { courseId: courseIdString } = useParams<{ courseId: string }>();
    const courseId = courseIdString ? parseInt(courseIdString) : undefined;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [courseParticipants, setCourseParticipants] = useState<User[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>('');
    const [isParticipantSaving, setIsParticipantSaving] = useState(false);

    const [files, setFiles] = useState<CourseFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    const fetchCourseDetails = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8080/api/courses/id/${id}`);
            if (res.status === 404) {
                setCourse(null);
                setError(`Course ID ${id} not found.`);
                return;
            }
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data: Course = await res.json();
            setCourse(data);

        } catch (err) {
            console.error("Failed to fetch course details:", err);
            setError("Failed to load course details. Please check the backend server is running at localhost:8080.");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchParticipants = useCallback(async (id: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/course_users/course/${id}`);
            if (!res.ok) throw new Error('Failed to fetch participants');

            const participantData: User[] = await res.json();
            setCourseParticipants(participantData);
        } catch (e) {
            console.error("Error fetching participants:", e);
            setCourseParticipants([]);
            setError('Could not load course participants from the API.');
        }
    }, []);

    // FIX TS6133: Removed unused 'id: string' parameter
    const fetchAvailableUsers = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/users/all`);
            if (!res.ok) throw new Error('Failed to fetch all users');

            const allUsers: User[] = await res.json();

            const participantIds = new Set(courseParticipants.map(p => p.userId));
            const available = allUsers.filter(user => !participantIds.has(user.userId));

            setAvailableUsers(available);
            setSelectedUserToAdd(available.length > 0 ? String(available[0].userId) : '');
        } catch (e) {
            console.error("Error fetching available users:", e);
            setAvailableUsers([]);
        }
    }, [courseParticipants]);

    const fetchFiles = useCallback(async (id: string) => {
        setLoadingFiles(true);
        try {
            const res = await fetch(`http://localhost:8080/api/files/course/${id}`);

            if (!res.ok) {
                setFiles([]);
                throw new Error(`Failed to fetch files. Status: ${res.status}`);
            }

            const data: CourseFile[] = await res.json();
            setFiles(data);
        } catch (e) {
            console.error("Error fetching files:", e);
            setFiles([]);
            setError('Could not load course files from the API.');
        } finally {
            setLoadingFiles(false);
        }
    }, []);

    useEffect(() => {
        if (courseIdString) {
            fetchCourseDetails(courseIdString);
            fetchParticipants(courseIdString);
            fetchFiles(courseIdString);
        }
    }, [courseIdString, fetchCourseDetails, fetchParticipants, fetchFiles]);

    useEffect(() => {
        if (courseIdString && courseParticipants.length >= 0) {
            // FIX TS6133: Removed unused argument from call site
            fetchAvailableUsers();
        }
    }, [courseIdString, courseParticipants, fetchAvailableUsers]);

    const handleUploadFile = useCallback(async (
        file: File,
        fileType: 'document' | 'photo',
        onComplete: (success: boolean, message: string) => void
    ) => {
        if (!courseId) {
            onComplete(false, "Course ID is missing.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('courseId', courseId.toString());
        formData.append('fileType', fileType);

        console.log(`API POST: Attempting upload of ${file.name} to course ${courseId}`);

        try {
            const res = await fetch('http://localhost:8080/api/files/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server error during upload: ${errorText}`);
            }

            const uploadedFileMetadata: CourseFile = await res.json();

            if (!uploadedFileMetadata || !uploadedFileMetadata.fileId) {
                throw new Error("Upload succeeded, but server response is missing the file ID.");
            }

            setFiles(prev => [...prev, uploadedFileMetadata].sort((a, b) => b.fileName.localeCompare(a.fileName)));

            onComplete(true, `Successfully uploaded ${uploadedFileMetadata.fileName}.`);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred during upload.';
            console.error("Error uploading file:", e);
            setError(`File Upload Error: ${message}`);
            onComplete(false, `Upload failed: ${message}`);
        }
    }, [courseId]);

    const handleDeleteFile = useCallback(async (fileId: number, fileName: string) => {
        if (!window.confirm(`Are you sure you want to delete the file "${fileName}"?`)) {
            return;
        }

        setLoadingFiles(true);
        setError(null);

        try {
            console.log(`API DELETE: Deleting file ${fileId}`);
            const res = await fetch(`http://localhost:8080/api/files/${fileId}`, {
                method: 'DELETE'
            });

            if (res.status === 404) {
                console.warn(`File ID ${fileId} not found on server, but removing from UI.`);
            } else if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server failed to delete file. Response: ${errorText}`);
            }

            setFiles(prev => prev.filter(f => f.fileId !== fileId));

        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred during deletion.';
            console.error("Error deleting file:", e);
            setError(`File Deletion Error: ${message}`);
        } finally {
            setLoadingFiles(false);
        }
    }, []);

    const handleAddParticipant = useCallback(async () => {
        if (!courseIdString || !selectedUserToAdd || isParticipantSaving) return;

        setIsParticipantSaving(true);
        setError(null);
        try {
            const payload = {
                courseId: parseInt(courseIdString),
                userId: parseInt(selectedUserToAdd)
            };
            const res = await fetch('http://localhost:8080/api/course_users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server failed to add participant. Response: ${errorText}`);
            }
            await fetchParticipants(courseIdString);

        } catch (e) {
            const message = e instanceof Error ? e.message : `Failed to add user ${selectedUserToAdd}.`;
            console.error("Error adding participant:", e);
            setError(`Participant Add Error: ${message}`);
        } finally {
            setIsParticipantSaving(false);
        }
    }, [courseIdString, selectedUserToAdd, isParticipantSaving, fetchParticipants]);

    const handleRemoveParticipant = useCallback(async (userIdString: string) => {
        if (!courseIdString || isParticipantSaving) return;

        setIsParticipantSaving(true);
        setError(null);
        try {
            const userId = parseInt(userIdString);

            const res = await fetch(`http://localhost:8080/api/course_users/course/${courseIdString}/user/${userId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server failed to remove participant. Response: ${errorText}`);
            }
            await fetchParticipants(courseIdString);

        } catch (e) {
            const message = e instanceof Error ? e.message : `Failed to remove user ${userIdString}.`;
            console.error("Error removing participant:", e);
            setError(`Participant Remove Error: ${message}`);
        } finally {
            setIsParticipantSaving(false);
        }
    }, [courseIdString, isParticipantSaving, fetchParticipants]);

    // FIX TS2322: Changed prop type to explicitly accept string | null
    const ErrorBanner: React.FC<{ message: string | null; onClose: () => void }> = ({ message, onClose }) => {
        if (!message) return null;
        return (
            <div className="flex items-center justify-between p-3 mb-6 bg-red-100 border border-red-400 text-red-800 rounded-lg shadow-md" role="alert">
                <p className="font-semibold text-sm">
                    <span className="font-extrabold mr-2">🚨 Error:</span> {message}
                </p>
                <button
                    onClick={onClose}
                    className="ml-4 text-red-600 hover:text-900 p-1 rounded-full transition font-bold text-lg leading-none"
                    title="Dismiss Error"
                >
                    &times;
                </button>
            </div>
        );
    };

    const InfoBlock: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
        <div className="flex justify-between items-center py-1.5">
            <span className="text-gray-500 text-sm font-medium w-2/5 pr-2">{label}</span>
            <span className="text-gray-800 text-sm font-semibold w-3/5 text-right">
                {value}
            </span>
        </div>
    );

    const ParticipantsBlock: React.FC = () => {
        const canAddUsers = availableUsers.length > 0;
        const loadingParticipants = loading || isParticipantSaving;
        const isButtonDisabled = loadingParticipants || !selectedUserToAdd || !canAddUsers;

        return (
            <div className="bg-white p-4 shadow-lg border border-gray-100 rounded-xl h-full">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700">Participants</h3>
                <div className="space-y-3">
                    <p className="text-sm font-semibold">Current Participants ({courseParticipants.length})</p>

                    <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
                        {loadingParticipants && courseParticipants.length === 0 ? (
                            <p className="text-sm text-blue-500 italic">Loading participants...</p>
                        ) : courseParticipants.length > 0 ? (
                            courseParticipants.map((user) => (
                                <div
                                    key={user.userId}
                                    className="flex justify-between items-center py-1 border-b last:border-b-0"
                                >
                                    <span className="text-sm text-gray-700">
                                        {user.firstName} {user.lastName}
                                    </span>
                                    <button
                                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 transition"
                                        onClick={() => handleRemoveParticipant(String(user.userId))}
                                        disabled={isParticipantSaving}
                                        title={`Remove ${user.firstName}`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No participants registered yet.</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <select
                            className="flex-grow border border-gray-300 rounded-lg text-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            value={selectedUserToAdd}
                            onChange={(e) => setSelectedUserToAdd(e.target.value)}
                            disabled={loadingParticipants || !canAddUsers}
                        >
                            <option value="" disabled={canAddUsers}>
                                {canAddUsers ? "Select user to add" : "No new users available"}
                            </option>
                            {availableUsers.map((user) => (
                                <option
                                    key={user.userId}
                                    value={String(user.userId)}
                                >
                                    {user.firstName} {user.lastName}
                                </option>
                            ))}
                        </select>
                        <button
                            className="bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={handleAddParticipant}
                            disabled={isButtonDisabled}
                        >
                            {isParticipantSaving ? 'Adding...' : '+ Add'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const FilesBlock: React.FC = () => {
        const hasFiles = files.length > 0;

        return (
            <div className="bg-white p-4 shadow-lg border border-gray-100 rounded-xl h-full">
                <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700">Files</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                    {loadingFiles ? (
                        <p className="text-sm text-blue-500 italic">Loading files...</p>
                    ) : hasFiles ? (
                        files.map((file) => (
                            <div key={file.fileId} className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate text-gray-800" title={file.fileName}>
                                        {file.fileName}
                                    </span>
                                    <span className="text-xs text-gray-500 block">
                                        {formatFileSize(file.sizeBytes)}
                                    </span>
                                </div>

                                <div className="flex space-x-2 text-gray-500 ml-4">
                                    <a
                                        href={`http://localhost:8080/api/files/download/${file.storagePath}?disposition=attachment`}
                                        title="Download File"
                                        className="hover:text-blue-600 p-1"
                                    >
                                        ⬇️
                                    </a>
                                    <a
                                        href={`http://localhost:8080/api/files/download/${file.storagePath}?disposition=inline`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="View File (New Tab)"
                                        className="hover:text-blue-600 p-1"
                                    >
                                        👁️
                                    </a>
                                    <button
                                        title="Delete"
                                        className="hover:text-red-600 p-1"
                                        onClick={() => handleDeleteFile(file.fileId, file.fileName)}
                                        disabled={loadingFiles}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic">No files attached to this course.</p>
                    )}
                </div>
            </div>
        );
    }

    interface StagedUploadBlockProps {
        blockType: 'document' | 'photo';
        handleUploadFile: (
            file: File,
            fileType: 'document' | 'photo',
            onComplete: (success: boolean, message: string) => void
        ) => Promise<void>;
    }

    const StagedUploadBlock: React.FC<StagedUploadBlockProps> = ({
                                                                     blockType,
                                                                     handleUploadFile
                                                                 }) => {
        const [stagedFiles, setStagedFiles] = useState<File[]>([]);
        const [isUploading, setIsUploading] = useState(false);
        const [uploadMessage, setUploadMessage] = useState<string | null>(null);
        const [isDragging, setIsDragging] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);

        const { title, icon, accept, description } = useMemo(() => {
            const isDocument = blockType === 'document';
            return {
                title: isDocument ? 'Upload Documents' : 'Upload Photos',
                icon: isDocument ? '📄' : '🖼️',
                accept: isDocument ? '.doc,.docx,.ppt,.pptx,.txt,.pdf' : 'image/png, image/jpeg, image/gif',
                description: isDocument ? 'Document files (.pdf, .docx, .txt, etc.)' : 'Image files (.jpg, .png, .gif)',
                color: isDocument ? 'blue' : 'indigo',
            };
        }, [blockType]);

        const addFilesToStaging = useCallback((newFiles: FileList | null) => {
            if (!newFiles) return;

            const currentNames = new Set(stagedFiles.map(f => f.name));
            const newFilesArray = Array.from(newFiles);

            const uniqueNewFiles = newFilesArray.filter(file => !currentNames.has(file.name));

            if (uniqueNewFiles.length > 0) {
                setStagedFiles(prev => [...prev, ...uniqueNewFiles]);
                setUploadMessage(null);
            }
        }, [stagedFiles]);

        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            addFilesToStaging(event.target.files);
            event.target.value = '';
        };

        const handleRemoveFile = useCallback((fileToRemove: File) => {
            setStagedFiles(prev => prev.filter(f => f !== fileToRemove));
            setUploadMessage(null);
        }, []);

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
        };

        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            addFilesToStaging(e.dataTransfer.files);
        };

        const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
        };

        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setIsDragging(false);
        };

        const handleButtonClick = () => {
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        };

        const handleSubmit = useCallback(async () => {
            if (stagedFiles.length === 0 || isUploading) return;

            setIsUploading(true);
            setUploadMessage(null);
            setError(null);

            let failedCount = 0;
            let successfulCount = 0;

            try {
                for (const file of stagedFiles) {
                    await new Promise<void>((resolve) => {
                        handleUploadFile(file, blockType, (success, message) => {
                            if (success) {
                                successfulCount++;
                            } else {
                                failedCount++;
                                console.error(`Failed to upload ${file.name}: ${message}`);
                            }
                            resolve();
                        });
                    });
                }

                if (failedCount === 0) {
                    setUploadMessage(`✅ Success! Uploaded all ${successfulCount} ${blockType} file(s).`);
                } else if (successfulCount > 0) {
                    setUploadMessage(`⚠️ Partial Success: ${successfulCount} uploaded, ${failedCount} failed.`);
                } else {
                    setUploadMessage(`❌ Failed to upload any files. Check the console and the main error banner for details.`);
                }

                setStagedFiles([]);

            } catch (e) {
                setUploadMessage(`A critical error occurred during batch submission.`);
            } finally {
                setIsUploading(false);
            }
        }, [stagedFiles, isUploading, handleUploadFile, blockType]);

        const hasStagedFiles = stagedFiles.length > 0;
        const dropZoneClasses = isDragging
            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 transition duration-150";

        const buttonColor = blockType === 'document' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700';

        return (
            <div className="bg-white p-4 shadow-lg border border-gray-100 rounded-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-bold text-gray-700">{title}</h3>

                    <button
                        className={`text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-md disabled:bg-gray-400 ${buttonColor}`}
                        onClick={handleSubmit}
                        disabled={!hasStagedFiles || isUploading}
                    >
                        {isUploading ? 'Submitting...' : `Confirm Submission (${stagedFiles.length})`}
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Select your file(s) below to stage them. Click 'Confirm Submission' to upload them all.
                </p>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    multiple
                    style={{ display: 'none' }}
                />

                <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 text-gray-700">Staged for Upload ({stagedFiles.length})</h4>
                    <div className="border border-gray-300 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                        {stagedFiles.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No files staged yet.</p>
                        ) : (
                            stagedFiles.map((file, index) => (
                                <div key={index} className="flex justify-between items-center p-1.5 bg-gray-100 rounded-md">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate text-gray-800" title={file.name}>
                                            {file.name}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({formatFileSize(file.size)})
                                        </span>
                                    </div>
                                    <button
                                        className="text-red-500 hover:text-red-700 p-1 transition text-xs font-bold"
                                        onClick={() => handleRemoveFile(file)}
                                        disabled={isUploading}
                                        title={`Remove ${file.name} from staging`}
                                    >
                                        Remove 🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-4 ${dropZoneClasses}`}
                    onClick={handleButtonClick}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex justify-center items-center h-16">
                        <div className="text-4xl text-blue-500 mb-2">{icon}</div>
                    </div>

                    <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center justify-center">
                        <span className="mr-1">📁</span> Click to select or Drag and drop here
                    </p>
                    <p className="text-xs text-gray-500">
                        ({description})
                    </p>
                </div>

                {uploadMessage && <p className={`text-xs mt-2 font-medium p-2 rounded-lg ${uploadMessage.startsWith('✅') ? 'bg-green-100 text-green-700' : uploadMessage.startsWith('⚠️') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{uploadMessage}</p>}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-xl shadow-lg max-w-screen-xl mx-auto mt-10">
                <p className="text-xl text-blue-600">Loading course details for ID: {courseIdString}...</p>
            </div>
        );
    }

    if (error && !course) {
        const message = error || `Course details not found for ID: ${courseIdString}.`;
        return (
            <div className="p-8 text-center bg-red-50 border border-red-300 rounded-xl shadow-lg max-w-screen-xl mx-auto mt-10">
                <p className="text-xl text-red-600 font-bold mb-4">Error Loading Course</p>
                <p className="text-lg text-red-800">{message}</p>
            </div>
        );
    }

    // Safety check for course data
    if (!course) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-xl shadow-lg max-w-screen-xl mx-auto mt-10">
                <p className="text-xl text-gray-600">Course details are missing. Please check the provided ID.</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-screen-xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Detailed overview for course: {course.courseName}</h1>
                <p className="text-gray-500 mb-6"></p>

                <ErrorBanner message={error} onClose={() => setError(null)} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 shadow-lg border border-gray-100 rounded-xl h-full">
                        <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-700">Course Information</h3>
                        <div className="space-y-1">
                            <InfoBlock label="Course ID" value={course.courseId} />
                            <InfoBlock label="Department" value={formatText(course.department)} />
                            <InfoBlock label="Classification" value={formatText(course.classification)} />
                            <InfoBlock label="Participants" value={course.nparticipants} />
                            <InfoBlock label="Participant Group" value={course.p_group.map(formatText).join(', ')} />
                        </div>
                    </div>

                    <ParticipantsBlock />
                    <FilesBlock />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StagedUploadBlock blockType="document" handleUploadFile={handleUploadFile} />
                    <StagedUploadBlock blockType="photo" handleUploadFile={handleUploadFile} />
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;