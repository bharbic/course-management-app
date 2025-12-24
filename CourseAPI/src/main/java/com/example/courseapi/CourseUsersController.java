package com.example.courseapi;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/course_users")
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE})
public class CourseUsersController {

    private final CourseUsersRepository courseUsersRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public CourseUsersController(CourseUsersRepository courseUsersRepository, CourseRepository courseRepository, UserRepository userRepository) {
        this.courseUsersRepository = courseUsersRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/course/{courseId}")
    public List<User> getParticipantsByCourseId(@PathVariable Long courseId) {
        return courseUsersRepository.findParticipantsByCourseId(courseId);
    }

    @PostMapping
    public ResponseEntity<CourseUsers> addParticipant(@RequestBody Map<String, Object> payload) {
        Long courseId = ((Number) payload.get("courseId")).longValue();
        Long userId = ((Number) payload.get("userId")).longValue();

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found with ID: " + courseId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + userId));

        if (courseUsersRepository.findByCourseCourseIdAndUserUserId(courseId, userId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a participant in this course.");
        }

        CourseUsers courseUsers = new CourseUsers(course, user);
        CourseUsers savedCourseUsers = courseUsersRepository.save(courseUsers);

        return new ResponseEntity<>(savedCourseUsers, HttpStatus.CREATED);
    }

    @DeleteMapping("/course/{courseId}/user/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // 204 No Content
    public void removeParticipant(@PathVariable Long courseId, @PathVariable Long userId) {

        CourseUsers courseUsers = courseUsersRepository.findByCourseCourseIdAndUserUserId(courseId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant record not found."));

        courseUsersRepository.delete(courseUsers);
    }
}
