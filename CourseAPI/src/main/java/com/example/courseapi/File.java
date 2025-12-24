package com.example.courseapi;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "course_files")
public class File {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id")
    private Long fileId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    public File (){};

    @Column(name = "file_name")
    private String fileName; // Original file name
    @Column(name = "file_type")
    private String fileType; // e.g., 'document' or 'photo'
    @Column(name = "mime_type")
    private String mimeType; // e.g., 'application/pdf'
    @Column(name = "size_bytes")
    private Long sizeBytes;
    @Column(name = "storage_path")
    private String storagePath;

    public File(Course course, String fileName, String fileType, String mimeType, Long sizeBytes, String storagePath) {
        this.course = course;
        this.fileName = fileName;
        this.fileType = fileType;
        this.mimeType = mimeType;
        this.sizeBytes = sizeBytes;
        this.storagePath = storagePath;
    }

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

}
