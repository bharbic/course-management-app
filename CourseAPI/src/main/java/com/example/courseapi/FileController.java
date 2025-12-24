package com.example.courseapi;

import com.example.courseapi.FileService; // Assuming your service package is correct
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus; // For ResponseStatusException
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException; // For custom exceptions
import jakarta.servlet.http.HttpServletRequest; // For mime type detection
import java.io.FileNotFoundException;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:5173", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE})
public class FileController {

    private final FileRepository fileRepository;
    private final CourseRepository courseRepository;
    private final FileService fileService;

    public FileController(FileRepository fileRepository, CourseRepository courseRepository, FileService fileService) {
        this.fileRepository = fileRepository;
        this.courseRepository = courseRepository;
        this.fileService = fileService;
    }

    @GetMapping("/course/{courseId}")
    public List<File> getFilesByCourseId(@PathVariable Long courseId) {

        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found with ID: " + courseId);
        }
        return fileRepository.findByCourseCourseId(courseId);
    }

    @PostMapping("/upload")
    public ResponseEntity<File> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("courseId") Long courseId,
            @RequestParam("fileType") String fileType) {


        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found with ID: " + courseId));

        String storagePath;
        try {

            storagePath = fileService.storeFile(file);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file content.", e);
        }

        File fileMetadata = new File(
                course,
                file.getOriginalFilename(),
                fileType,
                file.getContentType(),
                file.getSize(),
                storagePath
        );

        File savedFile = fileRepository.save(fileMetadata);
        return new ResponseEntity<>(savedFile, HttpStatus.CREATED);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId) {

        Optional<File> fileOptional = fileRepository.findById(fileId);

        if (fileOptional.isEmpty()) {

            return ResponseEntity.notFound().build();
        }

        File fileToDelete = fileOptional.get();
        String storagePath = fileToDelete.getStoragePath();

        try {

            fileRepository.delete(fileToDelete);


            if (storagePath != null) {
                boolean deleted = fileService.deleteFileFromStorage(storagePath);
                if (!deleted) {

                    System.out.println("WARNING: File record deleted from DB, but file not found on disk: " + storagePath);
                }
            }


            return ResponseEntity.noContent().build();

        } catch (Exception e) {

            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete file and record.", e);
        }
    }

    @GetMapping("/download/{storagePath:.+}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String storagePath,
            @RequestParam(defaultValue = "attachment") String disposition,
            HttpServletRequest request) {

        try {
            Resource resource = fileService.loadFileAsResource(storagePath);

            String contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            String headerValue = disposition + "; filename=\"" + resource.getFilename() + "\"";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, headerValue)
                    .body(resource);
        } catch (FileNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found: " + storagePath, e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving file: " + storagePath, e);
        }
    }
}

