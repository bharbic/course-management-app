import CourseManagement from "../src/assets/CourseManagement.webp"
import CourseOverview from "../src/assets/CourseOverview.jpg"
import Administration from "../src/assets/Administration.webp"
import { Link } from "react-router-dom"
import { useTranslation } from "./useTranslation.ts";



    function course_home() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { t } = useTranslation();
        return (
            <>
                <div className="min-h-screen bg-gray-100">
                    <div className="flex justify-center gap-6 mt-8">
                        <Link to="/course_management"
                              className="w-[300px] h-[200px] relative shadow-lg overflow-hidden">
                            <img
                                src={CourseManagement}
                                alt="Course Management"
                                className="h-[200px] w-[300px]"
                            />
                            <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-left py-2 pl-4">
                                <p>{t("courseManagement")}</p>
                            </div>
                        </Link>
                        <Link to="/course_overview"
                              className="w-[300px] h-[200px] relative shadow-lg overflow-hidden">
                            <img
                                src={CourseOverview}
                                alt="Course Overview"
                                className="h-[200px] w-[300px]"
                            />
                            <div className="absolute bottom-0 w-full bg-black/60 text-white text-left text py-2 pl-4">
                                <p>{t("courseOverview")}</p>
                            </div>
                        </Link>
                        <Link to="/administration"
                              className="w-[300px] h-[200px] relative shadow-lg overflow-hidden">
                            <img
                                src={Administration}
                                alt="Administration"
                                className="h-[200px] w-[300px]"
                            />
                            <div className="absolute bottom-0 w-full bg-black/60 text-white text-left py-2 pl-4">
                                <p>{t("administration")}</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </>
        )
    }
export default course_home;

