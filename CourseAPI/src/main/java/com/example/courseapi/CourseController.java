package com.example.courseapi;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH, RequestMethod.DELETE})
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @GetMapping("/all")
    public List<Course> findAll(){
        return courseRepository.findAll();
    }

    @GetMapping("/name/{courseName}")
    public List<Course> getCoursesByName(@PathVariable("courseName") String courseName) {
        return courseRepository.findCourseByCourseName(courseName);
    }

    // NEW: GET /api/courses/user/{userId} (Fetch courses by user ID)
    @GetMapping("/user/{userId}")
    public List<Course> getCoursesByUserId(@PathVariable Long userId) {
        // IMPORTANT: Replace 'findByUserId' with the actual method name in your CourseRepository
        // This requires you to define a custom query method in CourseRepository,
        // typically: List<Course> findByUserId(Long userId);
        return courseRepository.findCoursesByUserId(userId);
    }

    @GetMapping("/department/{department}")
    public List<Course> getCoursesByDepartment(@PathVariable Department department) {
        return courseRepository.findByDepartment(department);
    }
    @GetMapping("/classification/{classification}")
    public List<Course> getCoursesByClassification(@PathVariable Classification classification) {
        return courseRepository.findByClassification(classification);
    }


    @GetMapping("/id/{course_id}")
    public Course getCourseById(@PathVariable Long course_id) {
        return courseRepository.findById(course_id).orElse(null);
    }

    @GetMapping("/search")
    public List<Course> searchCourses(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Department department,
            @RequestParam(required = false) Classification classification) {

        List<Course> results = courseRepository.findAll();

        if (name != null && !name.isEmpty()) {
            results = results.stream()
                    .filter(c -> c.getCourseName().toLowerCase().contains(name.toLowerCase()))
                    .toList();
        }

        if (department != null) {
            if (department.name().equals("all")) {
            } else {
                results = results.stream()
                        .filter(c -> c.getDepartment() == department)
                        .toList();
            }
        }
        if (classification != null) {
            results = results.stream()
                    .filter(c -> c.getClassification() == classification)
                    .toList();
        }

        return results;
    }

    @PostMapping
    public Course addCourse(@RequestBody Course course) {
        return courseRepository.save(course);
    }


    @DeleteMapping("/id/{course_id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long course_id) {
        if (!courseRepository.existsById(course_id)) {
            return ResponseEntity.notFound().build();
        }
        courseRepository.deleteById(course_id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/id/{course_id}")
    public ResponseEntity<Course> patchCourseById(@PathVariable Long course_id,
                                                  @RequestBody Map<String, Object> updates) {
        return courseRepository.findById(course_id)
                .map(course -> {
                    applyUpdates(course, updates);
                    return ResponseEntity.ok(courseRepository.save(course));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/name/{course_name}")
    public ResponseEntity<Course> patchCourseByName(@PathVariable String course_name,
                                                    @RequestBody Map<String, Object> updates) {
        return courseRepository.findByCourseName(course_name)
                .map(course -> {
                    applyUpdates(course, updates);
                    return ResponseEntity.ok(courseRepository.save(course));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void applyUpdates(Course course, Map<String, Object> updates) {
        if (updates.containsKey("course_name")) {
            course.setCourseName((String) updates.get("course_name"));
        }
        if (updates.containsKey("n_participants")) {
            course.setNParticipants(((Number) updates.get("n_participants")).longValue());
        }
        if (updates.containsKey("p_group")) {
            List<String> group = (List<String>) updates.get("p_group");
            course.setpGroup(group);
        }
        if (updates.containsKey("department")) {
            course.setDepartment(Department.valueOf((String) updates.get("department")));
        }
        if (updates.containsKey("classification")) {
            course.setClassification(Classification.valueOf((String) updates.get("classification")));
        }
    }
}