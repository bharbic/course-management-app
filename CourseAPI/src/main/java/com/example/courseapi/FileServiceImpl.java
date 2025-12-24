package com.example.courseapi;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger; // 👈 NEW: Import for better logging
import org.slf4j.LoggerFactory; // 👈 NEW: Import for better logging

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileServiceImpl.class); // 👈 Logger initialized

    private final Path fileStorageLocation = Paths.get("./uploads").toAbsolutePath().normalize();

    public FileServiceImpl() {
        try {
            // Ensure the upload directory exists
            Files.createDirectories(this.fileStorageLocation);
            logger.info("File storage location initialized at: {}", this.fileStorageLocation); // 👈 Use logger
        } catch (Exception ex) {
            logger.error("Could not create the directory where the uploaded files will be stored. Check permissions!", ex);
            throw new RuntimeException("Failed to initialize file storage directory. Check file system permissions.", ex);
        }
    }

    @Override
    public boolean deleteFileFromStorage(String storagePath) {
        if (storagePath == null || storagePath.isEmpty()) {
            return false;
        }
        try {
            Path filePath = this.fileStorageLocation.resolve(storagePath).normalize();

            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log the error if deletion fails (e.g., permission issues)
            System.err.println("ERROR: Could not delete file: " + storagePath + " Reason: " + e.getMessage());
            return false;
        }
    }

    @Override
    public Resource loadFileAsResource(String storagePath) throws Exception {
        Path filePath = this.fileStorageLocation.resolve(storagePath).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists()) {
            return resource;
        } else {
            throw new java.io.FileNotFoundException("File not found " + storagePath);
        }
    }

    @Override
    public String storeFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Failed to store empty file.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            extension = originalFilename.substring(i);
        }

        String uniqueFileName = UUID.randomUUID().toString() + extension;
        Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);

        try {
            logger.info("Attempting to save file {} to path: {}", uniqueFileName, targetLocation.toString()); // 👈 Log path

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            logger.info("Successfully stored file: {}", uniqueFileName);
        } catch (IOException ex) {
            logger.error("Error saving file {} to disk.", uniqueFileName, ex);
            throw new IOException("Could not store file " + uniqueFileName + ". A file system error occurred.", ex);
        }

        return uniqueFileName;
    }
}