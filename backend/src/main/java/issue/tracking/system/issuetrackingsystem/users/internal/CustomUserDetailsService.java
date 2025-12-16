package issue.tracking.system.issuetrackingsystem.users.internal;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        return userRepository.findByEmail(usernameOrEmail)
            .map(UserDetailsImpl::new)
            .or(() -> userRepository.findByUsername(usernameOrEmail).map(UserDetailsImpl::new))
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
