FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["UniRide.Api.csproj", "./"]
RUN dotnet restore "UniRide.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/."
RUN dotnet publish "UniRide.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "UniRide.Api.dll"]
