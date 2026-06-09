using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using UniRide.Api.Services;
using System;
using System.Linq;

namespace UniRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IBookingService _bookingService;

        public BookingsController(ApplicationDbContext db, IBookingService bookingService)
        {
            _db = db;
            _bookingService = bookingService;
        }

        [HttpGet("student/{studentId}")]
        public async Task<IActionResult> GetStudentBookings(Guid studentId)
        {
            var bookings = await _db.Bookings
                .Where(b => b.StudentId == studentId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
            return Ok(bookings);
        }

        [HttpGet("vendor/{vendorId}")]
        public async Task<IActionResult> GetVendorBookings(Guid vendorId)
        {
            var bookings = await _db.Bookings
                .Include(b => b.Student)
                .ThenInclude(s => s.Profile)
                .Where(b => b.VendorId == vendorId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
            return Ok(bookings);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto req)
        {
            var (success, error, booking) = await _bookingService.CreateBookingAsync(
                req.StudentId, req.TripId, req.Route, req.Company, req.Destination,
                req.Date, req.Time, req.Pickup, req.Seat, req.Ref, req.Amount, req.PriceNum
            );

            if (!success) return BadRequest(new { error });
            return Ok(booking);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingDto req)
        {
            var (success, error) = await _bookingService.CancelBookingAsync(id, req.StudentId);
            if (!success) return BadRequest(new { error });
            return Ok(new { ok = true });
        }
    }

    public class CreateBookingDto { public Guid StudentId { get; set; } public Guid TripId { get; set; } public string Route { get; set; } = ""; public string Company { get; set; } = ""; public string Destination { get; set; } = ""; public string Date { get; set; } = ""; public string? Time { get; set; } public string? Pickup { get; set; } public string? Seat { get; set; } public string Ref { get; set; } = ""; public string? Amount { get; set; } public decimal? PriceNum { get; set; } }
    public class CancelBookingDto { public Guid StudentId { get; set; } }
}
