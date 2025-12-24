package com.example.courseapi;

import jakarta.persistence.*;

@Entity
@Table(name = "course_users")
public class CourseUsers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cu_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public CourseUsers() {
    }

    public CourseUsers(Course course, User user) {
        this.course = course;
        this.user = user;
    }

    public Long getCu_id() {
        return cu_id;
    }

    public void setCu_id(Long cu_id) {
        this.cu_id = cu_id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
