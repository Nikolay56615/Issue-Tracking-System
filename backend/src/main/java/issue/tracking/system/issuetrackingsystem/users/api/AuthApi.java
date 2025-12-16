package issue.tracking.system.issuetrackingsystem.users.api;

public interface AuthApi {
    UserDto register(String email, String username, String password);
    void login(String email, String username, String password); // был String, меняем на void
}
