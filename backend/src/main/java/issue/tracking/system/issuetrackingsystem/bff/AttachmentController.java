package issue.tracking.system.issuetrackingsystem.bff;

import issue.tracking.system.issuetrackingsystem.issue.api.FileStorageApi;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final FileStorageApi fileStorage;

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> upload(@RequestParam("file") MultipartFile file) throws Exception {
        String url = fileStorage.saveFile(file.getOriginalFilename(), file.getBytes());
        return ResponseEntity.ok(new UploadResponse(url));
    }

    private String extractFileName(String input) {
        if (input == null) return null;
        int idx = input.lastIndexOf("/");
        return idx >= 0 ? input.substring(idx + 1) : input;
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> download(@RequestParam("filename") String filename) {
        String realFileName = extractFileName(filename);
        byte[] data = fileStorage.getFile(realFileName);
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=\"" + realFileName + "\"")
            .body(data);
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> delete(@RequestParam("filename") String filename) {
        String realFileName = extractFileName(filename);
        fileStorage.deleteFile(realFileName);
        return ResponseEntity.noContent().build();
    }

    public record UploadResponse(String url) {}
}
