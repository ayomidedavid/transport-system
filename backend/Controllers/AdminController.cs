using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using System.Linq;
using System;

namespace UniRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AdminController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData()
        {
            var users = await _db.Profiles.Include(p => p.User).ToListAsync();
            var vendors = await _db.Vendors.ToListAsync();
            var bookings = await _db.Bookings
                .Include(b => b.Student)
                .ThenInclude(s => s.Profile)
                .Include(b => b.Vendor)
                .OrderByDescending(b => b.CreatedAt)
                .Take(100)
                .ToListAsync();
            
            var transactions = await _db.Transactions
                .OrderByDescending(t => t.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(new {
                users = users.Select(u => new {
                    id = u.User.Id,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    email = u.User.Email,
                    phone = u.Phone,
                    matric = u.Matric,
                    department = u.Department,
                    role = u.Role,
                    joinedAt = u.CreatedAt
                }),
                vendors = vendors.Select(v => new {
                    id = v.Id,
                    name = v.Name,
                    email = v.Email,
                    phone = v.Phone,
                    address = v.Address,
                    contactPerson = v.ContactPerson,
                    registrationNumber = v.RegistrationNumber,
                    verificationStatus = v.VerificationStatus,
                    status = "active",
                    createdAt = v.CreatedAt
                }),
                bookings = bookings.Select(b => new {
                    id = b.Id,
                    @ref = b.Ref,
                    studentName = $"{b.Student?.Profile?.FirstName} {b.Student?.Profile?.LastName}".Trim(),
                    studentEmail = b.Student?.Email,
                    vendorName = b.Vendor?.Name ?? b.Company,
                    route = b.Route,
                    date = b.Date,
                    amount = b.PriceNum,
                    status = b.Status,
                    createdAt = b.CreatedAt
                }),
                transactions
            });
        }

        [HttpPost("vendors/{id}/approve")]
        public async Task<IActionResult> ApproveVendor(Guid id)
        {
            var vendor = await _db.Vendors.FindAsync(id);
            if (vendor == null) return NotFound();
            
            vendor.VerificationStatus = "approved";
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("vendors/{id}/reject")]
        public async Task<IActionResult> RejectVendor(Guid id, [FromBody] RejectDto req)
        {
            var vendor = await _db.Vendors.FindAsync(id);
            if (vendor == null) return NotFound();
            
            vendor.VerificationStatus = "rejected";
            vendor.RejectionReason = req.Reason;
            await _db.SaveChangesAsync();
            return Ok();
        }
    }

    public class RejectDto { public string Reason { get; set; } = ""; }
}
