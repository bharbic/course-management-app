package com.example.courseapi;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileService {

    String storeFile(MultipartFile file) throws IOException;
    Resource loadFileAsResource(String storagePath) throws Exception;

    boolean deleteFileFromStorage(String storagePath);
}
