package com.example.courseapi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course,Long>{

    List<Course> findByDepartment(Department department);
    List<Course> findByClassification(Classification classification);
    List<Course> findByDepartmentAndClassification(Department department, Classification classification);
    Optional<Course> findByCourseName(String courseName);
    List<Course> findByCourseNameContainingIgnoreCase(String courseName);
    List<Course> findCourseByCourseName(String courseName);

    @Query(value = "SELECT c FROM Course c JOIN CourseUsers cu ON c.id = cu.courseId WHERE cu.userId = :userId", nativeQuery = true)
    List<Course> findCoursesByUserId(@Param("userId") Long userId);
}
