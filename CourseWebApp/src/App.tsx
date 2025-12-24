import './App.css'

import { Routes, Route } from "react-router-dom"
import { Navigate } from "react-router-dom"
import CourseManagement from "./course_management.tsx"
import CourseOverview from "./course_overview.tsx"
import Administration from "./administration.tsx"
import CourseHome from "./course_home.tsx"
import CourseDetails from "./course_details.tsx";


function App() {
  return (
    <>
            <Routes>
                <Route path="/" element={<Navigate to="/course_home" replace />} />
                <Route path="/course_home" element={<CourseHome />} />
                <Route path="/course_management" element={<CourseManagement />} />
                <Route path="/course_overview" element={<CourseOverview />} />
                <Route path="/administration" element={<Administration />} />
                <Route path="/course_overview/:courseId" element={<CourseDetails />} />
                <Route path="*" element={<div className="font-bold size-24">404 Not Found</div>} />
            </Routes>
        </>
  )
}

export default App
