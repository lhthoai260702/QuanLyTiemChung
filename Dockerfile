# Stage 1: Môi trường Maven & Java 17 để Build code
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Copy toàn bộ mã nguồn backend vào trong môi trường docker
COPY . .
# Chạy lệnh build ra file .war (bỏ qua bước test để build nhanh hơn)
RUN mvn clean package -DskipTests

# Stage 2: Môi trường Java 17 siêu nhẹ chỉ để chạy App
FROM openjdk:17-jdk-slim
WORKDIR /app
# Copy file .war đã được build từ Stage 1 sang Stage 2
COPY --from=build /app/target/*.war app.war
# Mở cổng 8080
EXPOSE 8080
# Lệnh khởi chạy ứng dụng Spring Boot
ENTRYPOINT ["java", "-jar", "app.war"]