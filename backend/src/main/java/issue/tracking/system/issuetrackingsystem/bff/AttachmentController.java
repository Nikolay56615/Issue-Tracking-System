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

    @GetMapping("/download")
    public ResponseEntity<byte[]> download(@RequestParam("filename") String filename) {
        byte[] data = fileStorage.getFile(filename);
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
            .body(data);
    }

    public record UploadResponse(String url) {}
}
