using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using UniRide.Api.Data.Models;
using System;
using System.Linq;

namespace UniRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TripsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public TripsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveTrips()
        {
            var trips = await _db.Trips
                .Include(t => t.Vendor)
                .Where(t => t.Status == "active")
                .ToListAsync();
            return Ok(trips);
        }

        [HttpGet("vendor/{vendorId}")]
        public async Task<IActionResult> GetVendorTrips(Guid vendorId)
        {
            var trips = await _db.Trips
                .Where(t => t.VendorId == vendorId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
            return Ok(trips);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTrip([FromBody] Trip trip)
        {
            _db.Trips.Add(trip);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetActiveTrips), new { id = trip.Id }, trip);
        }
    }
}
