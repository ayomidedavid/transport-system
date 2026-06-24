using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UniRide.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(x => 
    x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.AddHttpClient<UniRide.Api.Services.IEmailService, UniRide.Api.Services.EmailService>();
builder.Services.AddScoped<UniRide.Api.Services.IAuthService, UniRide.Api.Services.AuthService>();
builder.Services.AddScoped<UniRide.Api.Services.IBookingService, UniRide.Api.Services.BookingService>();

// Configure EF Core
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl))
{
    // Convert Render's postgres:// url to a .NET connection string
    var connectionUrl = new Uri(databaseUrl);
    var userInfo = connectionUrl.UserInfo.Split(':');
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = Uri.UnescapeDataString(userInfo[1]);
    var port = connectionUrl.Port > 0 ? connectionUrl.Port : 5432;
    var connectionString = $"Host={connectionUrl.Host};Port={port};Database={connectionUrl.LocalPath.TrimStart('/')};Username={username};Password={password};SslMode=Require;TrustServerCertificate=True;";
    
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // Configure EF Core with SQLite for local dev
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite("Data Source=uniride.db"));
}

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? "default_secret_key_1234567890123456");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "uniride_api",
        ValidAudience = jwtSettings["Audience"] ?? "uniride_frontend"
    };
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any origin for local dev
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/notifications");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();

    // Seed default admin account
    if (!db.Users.Any(u => u.Email == "unitransit3@gmail.com"))
    {
        var adminUser = new UniRide.Api.Data.Models.User
        {
            Id = Guid.NewGuid(),
            Email = "unitransit3@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123456"),
            EmailConfirmed = true
        };
        var adminProfile = new UniRide.Api.Data.Models.Profile
        {
            Id = adminUser.Id,
            User = adminUser,
            Email = "unitransit3@gmail.com",
            FirstName = "System",
            LastName = "Admin",
            Role = "admin"
        };
        db.Users.Add(adminUser);
        db.Profiles.Add(adminProfile);
        db.SaveChanges();
    }

    var latestOtp = db.Otps.OrderByDescending(o => o.CreatedAt).FirstOrDefault();
    if (latestOtp != null) {
        Console.WriteLine($"[TEMP] LATEST OTP CODE IS: {latestOtp.Code}");
    }
}

app.Run();
