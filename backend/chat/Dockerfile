
FROM eclipse-temurin:24-jdk-alpine AS build


WORKDIR /app


COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .


RUN chmod +x mvnw


RUN ./mvnw dependency:go-offline -B


COPY src src


RUN ./mvnw clean package -DskipTests


FROM eclipse-temurin:24-jre-alpine


RUN apk add --no-cache curl tzdata && \
    cp /usr/share/zoneinfo/Europe/Sarajevo /etc/localtime && \
    echo "Europe/Sarajevo" > /etc/timezone


RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup


WORKDIR /app


COPY --from=build /app/target/*.jar app.jar


RUN chown appuser:appgroup app.jar


USER appuser


EXPOSE 8080


HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/users/online || exit 1


ENTRYPOINT ["java", "-jar", "app.jar"]
