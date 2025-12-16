package issue.tracking.system.issuetrackingsystem.users.internal;

import issue.tracking.system.issuetrackingsystem.users.api.CurrentUserProvider;
import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import java.util.Optional;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@Primary
class SecurityCurrentUserProvider implements CurrentUserProvider {

    @Override
    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl principal)) {
            throw new SecurityException("Unauthenticated");
        }
        return principal.getId();
    }

    @Override
    public Optional<UserDto> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl principal)) {
            return Optional.empty();
        }
        return Optional.of(new UserDto(principal.getId(), principal.getUsername(), principal.getUsername()));
    }
}