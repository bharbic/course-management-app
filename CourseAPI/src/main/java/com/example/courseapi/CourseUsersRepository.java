package com.example.courseapi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface CourseUsersRepository extends JpaRepository<CourseUsers, Long> {


    @Query("SELECT cu.user FROM CourseUsers cu WHERE cu.course.courseId = :courseId")
    List<User> findParticipantsByCourseId(@Param("courseId") Long courseId);

    Optional<CourseUsers> findByCourseCourseIdAndUserUserId(Long courseId, Long userId);
}