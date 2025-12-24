package com.example.courseapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;

import java.util.List;

import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="course_id")
    private Long courseId;

    @Column(name="n_participants")
    private Long nParticipants;

    @Column(name="course_name")
    private String courseName;

    @Enumerated(EnumType.STRING)
    private Classification classification;

    @Enumerated(EnumType.STRING)
    private Department department;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "p_group", columnDefinition = "text[]")
    private List<String> pGroup;

    public Course(){}

    public Course(Long nParticipants, String courseName, Classification classification, Department department, List<String> pGroup) {
        this.nParticipants = nParticipants;
        this.courseName = courseName;
        this.classification = classification;
        this.department = department;
        this.pGroup = pGroup;
    }

    @JsonProperty("p_group")
    public List<ParticipationGroup> getParticipationGroup() {
        return pGroup != null ? pGroup.stream().map(ParticipationGroup::valueOf).toList() : List.of();
    }
    @JsonProperty("p_group")
    public void setParticipationGroup(List<ParticipationGroup> participants) {
        this.pGroup = participants.stream().map(Enum::name).toList();
    }

    public void setCourseId(Long course_id) {
        this.courseId = course_id;
    }

    public void setNParticipants(Long n_participants) {
        this.nParticipants = n_participants;
    }

    public void setCourseName(String name) {
        this.courseName = name;
    }

    public void setClassification(Classification classification) {
        this.classification = classification;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public void setpGroup(List<String> pGroup) {
        this.pGroup = pGroup;
    }

    public List<String> getPGroup() {
        return pGroup;
    }
    public Long getCourseId() {
        return courseId;
    }
    public Long getNParticipants() {
        return nParticipants;
    }
    public String getCourseName() {
        return courseName;
    }
    public Classification getClassification() {
        return classification;
    }
    public Department getDepartment() {
        return department;
    }


}
