FROM eclipse-temurin:25-jdk AS builder

WORKDIR /workspace

COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle
COPY src/main src/main

RUN chmod +x gradlew \
    && ./gradlew --no-daemon bootJar \
    && cp build/libs/*.jar /tmp/app.jar

FROM eclipse-temurin:25-jre

WORKDIR /app

RUN useradd --system --uid 1001 --create-home spring

ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+ExitOnOutOfMemoryError -Djava.awt.headless=true"

COPY --from=builder /tmp/app.jar /app/app.jar

EXPOSE 8080

USER spring

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
