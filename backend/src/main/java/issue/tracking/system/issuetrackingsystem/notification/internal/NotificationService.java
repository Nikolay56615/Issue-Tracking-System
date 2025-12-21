package issue.tracking.system.issuetrackingsystem.notification.internal;

import issue.tracking.system.issuetrackingsystem.users.api.UserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
class NotificationService {

    private final UserProvider userProvider;

    public void notifyProjectMembers(Long projectId, Long excludeUserId, String message) {

        log.info("NOTIFICATION [Project {}]: {}", projectId, message);

        userProvider.findUserById(excludeUserId).ifPresent(actor -> {
            log.info("   -> Action performed by: {}", actor.username());
        });

        log.info("   -> Sending emails to other members... (Simulated)");
    }
}
