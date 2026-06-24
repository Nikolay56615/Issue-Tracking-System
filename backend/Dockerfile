FROM eclipse-temurin:21-jdk-alpine AS build
RUN umask 0000
RUN apk add --no-cache bash
WORKDIR /app
COPY gradlew build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN chmod +x gradlew && ./gradlew build -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache bash
WORKDIR /app
COPY --from=build /app/build/libs/IssueTrackingSystem-0.0.1-SNAPSHOT.jar IssueTrackingSystem-0.0.1-SNAPSHOT.jar
ENTRYPOINT ["java", "-jar", "IssueTrackingSystem-0.0.1-SNAPSHOT.jar"]
EXPOSE 8080
EXPOSE 2375
