# Bước 1: Build ứng dụng
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Xóa các file phụ (nếu có) và tự động nhận diện file .jar hoặc .war
RUN rm -f target/*-plain.*
RUN cp target/*.jar app.jar 2>/dev/null || cp target/*.war app.jar

# Bước 2: Chạy ứng dụng
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/app.jar .
ENTRYPOINT ["java", "-jar", "app.jar"]