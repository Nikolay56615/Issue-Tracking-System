package issue.tracking.system.issuetrackingsystem.issue.internal;

import issue.tracking.system.issuetrackingsystem.issue.api.FileStorageApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class LocalFileStorage implements FileStorageApi {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.public-prefix:/files/}")
    private String publicPrefix;

    @Override
    public String saveFile(String filename, byte[] content) {
        String ext = (filename != null && filename.contains(".")) ? filename.substring(filename.lastIndexOf(".")) : "";
        String stored = UUID.randomUUID() + ext;
        try {
            Path dir = Path.of(uploadDir);
            Files.createDirectories(dir);
            Files.write(dir.resolve(stored), content);
            return publicPrefix + stored;
        } catch (Exception e) {
            throw new RuntimeException("Cannot save file", e);
        }
    }

    @Override
    public byte[] getFile(String path) {
        try {
            return Files.readAllBytes(Path.of(uploadDir, path));
        } catch (Exception e) {
            throw new RuntimeException("Cannot read file", e);
        }
    }

    @Override
    public void deleteFile(String path) {
        try {
            Files.deleteIfExists(Path.of(uploadDir, path));
        } catch (Exception e) {
            throw new RuntimeException("Cannot delete file", e);
        }
    }
}
