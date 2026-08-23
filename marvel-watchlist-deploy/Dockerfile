FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

COPY . .

RUN chmod +x build.sh && ./build.sh

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/out ./out

EXPOSE 8080

CMD ["java", "-cp", "out", "Main"]
