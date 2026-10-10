package com.rightFit.service;

import com.rightFit.exception.BusinessRuleException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

/**
 * Local-disk storage for uploaded certificate documents (Associate phase). Keyed by a
 * server-generated UUID - the client's filename/path is never trusted. Requires app.file.upload-dir
 * to point at persistent storage in the deployment target (confirmed before this was built).
 */
@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/png", "image/jpeg");
    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024;

    private final Path root;

    public FileStorageService(@Value("${app.file.upload-dir}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not initialize file storage directory: " + root, e);
        }
    }

    /** Validates and writes the file, returning its server-generated storage key. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("No file was provided");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BusinessRuleException("File exceeds the 10MB size limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessRuleException("Unsupported file type: " + contentType
                    + ". Only PDF, PNG and JPEG are allowed");
        }
        String storageKey = UUID.randomUUID().toString();
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new BusinessRuleException("Invalid file storage path");
        }
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store uploaded file", e);
        }
        log.info("Stored certificate document {} ({} bytes, {})", storageKey, file.getSize(), contentType);
        return storageKey;
    }

    public byte[] read(String storageKey) {
        try {
            return Files.readAllBytes(resolve(storageKey));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read stored file: " + storageKey, e);
        }
    }

    /** Best-effort: a failed delete leaves an orphaned file on disk, never a dangling DB reference. */
    public void delete(String storageKey) {
        if (storageKey == null) {
            return;
        }
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException e) {
            log.warn("Failed to delete stored file {} (leaving it orphaned on disk)", storageKey, e);
        }
    }

    private Path resolve(String storageKey) {
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new BusinessRuleException("Invalid file storage path");
        }
        return target;
    }
}
