package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.issue.api.FileStorageApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final FileStorageApi fileStorage;

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        try {
            String url = fileStorage.saveFile(file.getOriginalFilename(), file.getBytes());
            return ResponseEntity.ok(new UploadResponse(url));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file", e);
        }
    }

    private String extractStoredFileName(String url) {
        if (url == null || !url.startsWith("/files/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file URL");
        }
        return url.substring("/files/".length());
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> download(@RequestParam("filename") String filename) {
        String realFileName = extractStoredFileName(filename);
        try {
            byte[] data = fileStorage.getFile(realFileName);
            if (data == null || data.length == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
            }
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + realFileName + "\"")
                .body(data);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to download file", e);
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> delete(@RequestParam("filename") String filename) {
        String realFileName = extractStoredFileName(filename);
        try {
            fileStorage.deleteFile(realFileName);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete file", e);
        }
    }

    public record UploadResponse(String url) {}
}