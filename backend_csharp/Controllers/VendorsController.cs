using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using UniRide.Api.Data.Models;
using System;

namespace UniRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VendorsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public VendorsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetVendors()
        {
            var vendors = await _db.Vendors.ToListAsync();
            return Ok(vendors);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetVendor(Guid id)
        {
            var vendor = await _db.Vendors.FindAsync(id);
            if (vendor == null) return NotFound();
            return Ok(vendor);
        }

        [HttpGet("owner/{ownerId}")]
        public async Task<IActionResult> GetVendorByOwner(Guid ownerId)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.OwnerId == ownerId);
            if (vendor == null) return NotFound();
            return Ok(new {
                id = vendor.Id,
                name = vendor.Name,
                registrationNumber = vendor.RegistrationNumber,
                contactPerson = vendor.ContactPerson,
                email = vendor.Email,
                phone = vendor.Phone,
                address = vendor.Address,
                verificationStatus = vendor.VerificationStatus
            });
        }
    }
}
