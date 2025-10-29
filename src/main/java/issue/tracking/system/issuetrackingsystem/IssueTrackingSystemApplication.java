package issue.tracking.system.issuetrackingsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class IssueTrackingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(IssueTrackingSystemApplication.class, args);
    }

}
