package issue.tracking.system.issuetrackingsystem.notification.internal;

import issue.tracking.system.issuetrackingsystem.users.api.UserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j // Lombok для логирования (или просто System.out.println)
@RequiredArgsConstructor
class NotificationService {

    private final UserProvider userProvider; // Чтобы получить email пользователей
    // В идеале ProjectAccessApi должен иметь метод getProjectMembers(projectId),
    // но мы его не добавили в API. Допустим, мы пока уведомляем только автора.

    public void notifyProjectMembers(Long projectId, Long excludeUserId, String message) {
        // Симуляция: отправляем уведомление всем
        // В реальности здесь мы бы достали список участников проекта через ProjectAccessApi

        log.info("NOTIFICATION [Project {}]: {}", projectId, message);

        // Пример: найти автора действия
        userProvider.findUserById(excludeUserId).ifPresent(actor -> {
            log.info("   -> Action performed by: {}", actor.username());
        });

        log.info("   -> Sending emails to other members... (Simulated)");
    }
}
