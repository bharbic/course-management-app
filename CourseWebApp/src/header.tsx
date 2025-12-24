import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import { useTranslation } from "./useTranslation.ts";

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const { language, setLanguage } = useLanguage();
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();


    useEffect(() => {
        fetch("http://localhost:8080/api/users/9")
            .then((res) => {
                if (!res.ok) throw new Error("BAD_NET_RESPONSE");
                return res.json();
            })
            .then((data) => {
                setUser(data.firstName);
                setLoading(false);
            })
            .catch((err) => {
                console.error("ERROR_FETCHING_USER", err);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                setUser("null");
                setLoading(false)
            });

    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <>
            <header className="bg-black text-white no-underline shadow-md w-full flex justify-between items-center px-6 py-4">
                <div className="flex items-center">
                <button
                    className="focus:outline-none mr-2 z-10"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {isOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>

                </button>
                    <span className="absolute text-lg font-semibold pl-9 z-0">{t("coursesApp")}</span>
                </div>

                <div className="relative pt-1" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="focus:outline-none"
                    >
                        <img
                            src="https://www.svgrepo.com/show/506352/user-1.svg"
                            alt="Profile"
                            className="w-10 h-10 content-center invert rounded-full p-1"
                        />
                    </button>

                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded-md shadow-lg z-50 drop-shadow-2xl">
                        <div className="px-4 py-2 border-b border-gray-200">
                            <p className="text-gray-500 uppercase tracking-tight pt-1 pb-1">
                                {loading ? t("loading") : `${t("welcome")}, ${user}`}
                            </p>
                        </div>
                        
                        <div className="px-4 py-2 border-b border-gray-200">
                            <p className="font-medium mb-2 uppercase pt-2">{t("language")}</p>
                            <div className="flex flex-col space-y-1">
                                <label className="flex items-center space-x-2">
                                    <input type="radio" name="language" value="en" checked={language === "en"} onChange={() => setLanguage("en")} defaultChecked={language === "en"} />
                                    <img
                                        src="https://www.svgrepo.com/show/401788/flag-for-united-kingdom.svg"
                                        alt="English"
                                        className="w-6 h-6 rounded-full"
                                    >
                                    </img>
                                    <span>English</span>
                                </label>
                                <label className="flex items-center space-x-2 pb-2">
                                    <input type="radio" name="language" value="de" checked={language === "de"} onChange={() => setLanguage("de")} />
                                    <img
                                        src="https://www.svgrepo.com/show/401612/flag-for-germany.svg"
                                        alt="German"
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span>{t("german")}</span>
                                </label>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={() => alert(`${t("logout")}...`)}
                            className="w-full text-left px-4 py-2 text-blue-400 hover:bg-gray-100 rounded-b-md pt-4"
                        >
                            {t("logout")}
                        </button>
                    </div>
                )}
                </div>
            </header>

            {isOpen && (
                <div className="fixed no-underline top-0 left-0 h-full w-64 bg-black text-white shadow-lg z-50">
                    <div className="flex justify-between items-center px-8 py-6 border-b border-black">
                        <span className="font-bold">{t("coursesApp")}</span>
                        <button
                            className="focus:outline-none"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <nav className="no-underline flex flex-col mt-4 space-y-2 px-4">
                        <Link to="/course_home" className="no-underline hover:text-gray-300">{t("home")}</Link>
                        <Link to="/course_management" className="no-underline hover:text-gray-300">{t("courseManagement")}</Link>
                        <Link to="/course_overview" className="no-underline hover:text-gray-300">{t("courseOverview")}</Link>
                        <Link to="/administration" className="no-underline hover:text-gray-300">{t("administration")}</Link>
                    </nav>
                </div>
            )}
        </>
    );
};

export default Header;
