# Multi-stage build for Spring Boot + React application

# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build

# Copy Maven wrapper and pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies (this layer will be cached)
RUN ./mvnw dependency:go-offline -B || true

# Copy all source files
COPY src/ ./src/
COPY package.json package-lock.json* ./
COPY vite.config.ts tsconfig.json tsconfig.node.json ./
COPY index.html postcss.config.js tailwind.config.js* ./
COPY public/ ./public/ 2>/dev/null || true

# Build the application (includes frontend build via frontend-maven-plugin)
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring

# Copy the JAR from build stage
COPY --from=build /build/target/driverEvents-*.jar app.jar

# Change ownership
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", \
    "-Dspring.profiles.active=prod", \
    "-Dserver.port=${PORT:-8080}", \
    "-Xmx384m", \
    "-Xms256m", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", \
    "app.jar"]