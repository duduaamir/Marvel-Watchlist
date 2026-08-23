FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

COPY . .

RUN chmod +x build.sh && ./build.sh

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/out ./out

EXPOSE 10000

CMD ["java", "-cp", "out", "com.marvelwatchlist.server.Main"]

