using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using UniRide.Api.Data;
using UniRide.Api.Data.Models;
using UniRide.Api.Hubs;

namespace UniRide.Api.Services
{
    public interface IAuthService
    {
        Task<(bool success, string error, Guid? userId)> RegisterStudentAsync(string email, string password, string firstName, string lastName, string? phone, string? matric, string? department, string? studentId);
        Task<(bool success, string error, Guid? userId)> RegisterVendorAsync(string email, string password, string contactName, string companyName, string? regNumber, string? phone, string? address);
        Task<(bool success, string error)> SendOtpAsync(string email, string subjectPrefix = "Verification Code");
        Task<(bool success, string error)> VerifyOtpAsync(string email, string code);
        Task<(bool success, string error, string token, User? user)> LoginAsync(string email, string password);
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly IHubContext<NotificationHub> _hubContext;

        public AuthService(ApplicationDbContext db, IEmailService emailService, IConfiguration config, IHubContext<NotificationHub> hubContext)
        {
            _db = db;
            _emailService = emailService;
            _config = config;
            _hubContext = hubContext;
        }

        public async Task<(bool success, string error, Guid? userId)> RegisterStudentAsync(string email, string password, string firstName, string lastName, string? phone, string? matric, string? department, string? studentId)
        {
            email = email.ToLower().Trim();

            if (await _db.Users.AnyAsync(u => u.Email == email))
                return (false, "An account with this email already exists.", null);

            var user = new User
            {
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
            };

            var profile = new Profile
            {
                User = user,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Phone = phone,
                Matric = matric,
                Department = department,
                StudentId = studentId,
                Role = "student"
            };

            _db.Users.Add(user);
            _db.Profiles.Add(profile);

            await _db.SaveChangesAsync();

            // Send OTP
            await SendOtpAsync(email);

            return (true, string.Empty, user.Id);
        }

        public async Task<(bool success, string error, Guid? userId)> RegisterVendorAsync(string email, string password, string contactName, string companyName, string? regNumber, string? phone, string? address)
        {
            email = email.ToLower().Trim();

            if (await _db.Users.AnyAsync(u => u.Email == email))
                return (false, "An account with this email already exists.", null);

            var user = new User
            {
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
            };

            var nameParts = contactName.Split(' ', 2);
            var firstName = nameParts.Length > 0 ? nameParts[0] : "";
            var lastName = nameParts.Length > 1 ? nameParts[1] : "";

            var profile = new Profile
            {
                User = user,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Phone = phone,
                Role = "vendor"
            };

            var vendor = new Vendor
            {
                Id = user.Id,
                OwnerId = user.Id,
                Name = companyName,
                RegistrationNumber = regNumber ?? "",
                ContactPerson = contactName,
                Email = email,
                Phone = phone ?? "",
                Address = address ?? "",
                VerificationStatus = "pending"
            };

            _db.Users.Add(user);
            _db.Profiles.Add(profile);
            _db.Vendors.Add(vendor);

            await _db.SaveChangesAsync();

            // Send OTP
            await SendOtpAsync(email);

            return (true, string.Empty, user.Id);
        }

        public async Task<(bool success, string error)> SendOtpAsync(string email, string subjectPrefix = "Verification Code")
        {
            email = email.ToLower().Trim();
            var code = new Random().Next(100000, 999999).ToString();
            
            var otp = new Otp
            {
                Email = email,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            _db.Otps.Add(otp);
            await _db.SaveChangesAsync();

            string html = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset=""utf-8"">
                    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                    <style>
                        body {{ margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
                        .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }}
                        .header {{ background-color: #064e3b; padding: 40px 20px; text-align: center; color: #ffffff; }}
                        .header h1 {{ margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; }}
                        .header p {{ margin: 10px 0 0; color: #a7f3d0; font-size: 16px; }}
                        .content {{ padding: 40px 30px; text-align: center; color: #1f2937; }}
                        .content h2 {{ margin: 0 0 20px; font-size: 22px; font-weight: 700; color: #111827; }}
                        .content p {{ font-size: 16px; line-height: 1.5; margin: 0 0 30px; color: #4b5563; }}
                        .code-box {{ background: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 25px; margin: 0 auto 30px; max-width: 300px; }}
                        .code {{ font-size: 42px; font-weight: 800; color: #047857; letter-spacing: 8px; margin: 0; }}
                        .footer {{ background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }}
                        .footer p {{ margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6; }}
                    </style>
                </head>
                <body>
                    <div class=""container"">
                        <div class=""header"">
                            <h1>🚌 UNIRIDE</h1>
                            <p>University Transport Management</p>
                        </div>
                        <div class=""content"">
                            <h2>{subjectPrefix}</h2>
                            <p>We received a request to verify your UniRide account. Please use the verification code below to complete the process. This code is valid for <strong>10 minutes</strong>.</p>
                            <div class=""code-box"">
                                <p class=""code"">{code}</p>
                            </div>
                            <p>If you did not request this code, you can safely ignore this email.</p>
                        </div>
                        <div class=""footer"">
                            <p>Secured by UniRide • Redeemer's University</p>
                            <p>If you need assistance, please reply to this email or contact support.</p>
                        </div>
                    </div>
                </body>
                </html>";

            await _emailService.SendEmailAsync(email, $"Your UniRide {subjectPrefix}", html);

            return (true, string.Empty);
        }

        public async Task<(bool success, string error)> VerifyOtpAsync(string email, string code)
        {
            email = email.ToLower().Trim();

            var otp = await _db.Otps
                .Where(o => o.Email == email && o.Code == code && o.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (otp == null) return (false, "Invalid or expired code.");

            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Email == email);
            if (user != null)
            {
                user.EmailConfirmed = true;

                if (user.Profile?.Role == "vendor")
                {
                    var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == user.Id);
                    var notif = new Notification
                    {
                        Type = "vendor_approval",
                        Title = "New Vendor Registration",
                        Body = $"A new logistics company ({vendor?.Name ?? "Unknown"}) has registered and is pending your approval.",
                        RecipientRole = "admin"
                    };
                    _db.Notifications.Add(notif);
                    await _db.SaveChangesAsync();

                    await _hubContext.Clients.Group("admin").SendAsync("ReceiveNotification", new
                    {
                        id = notif.Id,
                        type = notif.Type,
                        title = notif.Title,
                        body = notif.Body,
                        createdAt = notif.CreatedAt
                    });
                }
                else
                {
                    await _db.SaveChangesAsync();
                }
            }

            _db.Otps.RemoveRange(_db.Otps.Where(o => o.Email == email));
            await _db.SaveChangesAsync();

            return (true, string.Empty);
        }

        public async Task<(bool success, string error, string token, User? user)> LoginAsync(string email, string password)
        {
            email = email.ToLower().Trim();
            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return (false, "Invalid credentials.", string.Empty, null);

            if (!user.EmailConfirmed)
                return (false, "Email not confirmed", string.Empty, user);

            var token = GenerateJwt(user);
            return (true, string.Empty, token, user);
        }

        private string GenerateJwt(User user)
        {
            var jwtSettings = _config.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? "default_secret_key_1234567890123456");

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Profile.Role)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
