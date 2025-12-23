package issue.tracking.system.issuetrackingsystem.issue.api;

public interface FileStorageApi {
    String saveFile(String filename, byte[] content);
    byte[] getFile(String path);
    boolean deleteFile(String path);
}
