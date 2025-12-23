package issue.tracking.system.issuetrackingsystem.issue.api;

public interface FileStorageApi {
    String saveFile(String filename, byte[] content);
    byte[] getFile(String path);
    void deleteFile(String path);
}
