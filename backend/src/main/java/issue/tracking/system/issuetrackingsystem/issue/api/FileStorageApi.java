package issue.tracking.system.issuetrackingsystem.issue.api;

// Интерфейс для работы с физическим хранилищем (Диск, S3, MinIO)
public interface FileStorageApi {
    String saveFile(String filename, byte[] content);
    byte[] getFile(String path);
    void deleteFile(String path);
}
