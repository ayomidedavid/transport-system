using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UniRide.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using UniRide.Api.Data;
using UniRide.Api.Data.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace UniRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ApplicationDbContext _db;

        public AuthController(IAuthService authService, ApplicationDbContext db)
        {
            _authService = authService;
            _db = db;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            return Ok(new {
                id = user.Id,
                email = user.Email,
                firstName = user.Profile.FirstName,
                lastName = user.Profile.LastName,
                phone = user.Profile.Phone,
                matric = user.Profile.Matric,
                department = user.Profile.Department,
                studentId = user.Profile.StudentId,
                accountType = user.Profile.Role == "vendor" ? "logistics" : user.Profile.Role
            });
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupDto req)
        {
            var (success, error, userId) = await _authService.RegisterStudentAsync(req.Email, req.Password, req.FirstName, req.LastName, req.Phone, req.Matric, req.Department, req.StudentId);
            if (!success) return BadRequest(new { error });
            return Ok(new { ok = true, userId });
        }

        [HttpPost("vendor-signup")]
        public async Task<IActionResult> VendorSignup([FromBody] VendorSignupDto req)
        {
            var (success, error, userId) = await _authService.RegisterVendorAsync(req.Email, req.Password, req.ContactName, req.CompanyName, req.RegNumber, req.Phone, req.Address);
            if (!success) return BadRequest(new { error });
            return Ok(new { ok = true, userId });
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] EmailDto req)
        {
            var (success, error) = await _authService.SendOtpAsync(req.Email);
            if (!success) return StatusCode(500, new { error });
            return Ok(new { ok = true });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto req)
        {
            var (success, error) = await _authService.VerifyOtpAsync(req.Email, req.Code);
            if (!success) return BadRequest(new { error });
            return Ok(new { ok = true });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto req)
        {
            var (success, error, token, user) = await _authService.LoginAsync(req.Email, req.Password);
            if (!success) return Unauthorized(new { error });

            return Ok(new { 
                ok = true, 
                token, 
                user = new {
                    id = user!.Id,
                    email = user.Email,
                    firstName = user.Profile.FirstName,
                    lastName = user.Profile.LastName,
                    phone = user.Profile.Phone,
                    matric = user.Profile.Matric,
                    department = user.Profile.Department,
                    studentId = user.Profile.StudentId,
                    accountType = user.Profile.Role == "vendor" ? "logistics" : user.Profile.Role
                }
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto req)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == userId);
            if (profile == null) return NotFound();

            if (!string.IsNullOrEmpty(req.FirstName)) profile.FirstName = req.FirstName;
            if (!string.IsNullOrEmpty(req.LastName)) profile.LastName = req.LastName;
            if (!string.IsNullOrEmpty(req.Phone)) profile.Phone = req.Phone;
            if (!string.IsNullOrEmpty(req.Department)) profile.Department = req.Department;

            await _db.SaveChangesAsync();
            return Ok(new { ok = true });
        }
    }

    public class SignupDto { public string Email {get;set;}=""; public string Password {get;set;}=""; public string FirstName {get;set;}=""; public string LastName {get;set;}=""; public string? Phone {get;set;} public string? Matric {get;set;} public string? Department {get;set;} public string? StudentId {get;set;} }
    public class VendorSignupDto { public string Email {get;set;}=""; public string Password {get;set;}=""; public string ContactName {get;set;}=""; public string CompanyName {get;set;}=""; public string? RegNumber {get;set;} public string? Phone {get;set;} public string? Address {get;set;} }
    public class EmailDto { public string Email {get;set;}=""; }
    public class VerifyOtpDto { public string Email {get;set;}=""; public string Code {get;set;}=""; }
    public class LoginDto { public string Email {get;set;}=""; public string Password {get;set;}=""; }
    public class UpdateProfileDto { public string? FirstName {get;set;} public string? LastName {get;set;} public string? Phone {get;set;} public string? Department {get;set;} }
}
