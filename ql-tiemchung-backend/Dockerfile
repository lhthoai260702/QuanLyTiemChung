# Bước 1: Build ứng dụng (Sử dụng eclipse-temurin thay vì openjdk cũ)
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Bước 2: Chạy ứng dụng (Sử dụng eclipse-temurin bản gọn nhẹ)
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]