# Bước 1: Build ứng dụng với Maven
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Xóa file jar phụ (nếu có) và chuẩn bị đúng 1 file app.jar
RUN rm -f target/*-plain.jar
RUN cp target/*.jar app.jar

# Bước 2: Chạy ứng dụng
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
EXPOSE 8080

# Copy đích danh file app.jar đã được chuẩn bị từ bước build
COPY --from=build /app/app.jar .

ENTRYPOINT ["java", "-jar", "app.jar"]