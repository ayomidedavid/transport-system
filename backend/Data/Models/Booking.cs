using System;
using System.ComponentModel.DataAnnotations;

namespace UniRide.Api.Data.Models
{
    public class Booking
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid StudentId { get; set; } // Refers to User.Id
        public Guid? TripId { get; set; }
        public Guid? VendorId { get; set; }

        [Required]
        public string Route { get; set; } = string.Empty;

        [Required]
        public string Company { get; set; } = string.Empty;

        [Required]
        public string Destination { get; set; } = string.Empty;

        public string? VehicleType { get; set; }

        public string Status { get; set; } = "pending"; // confirmed, pending, cancelled, completed

        [Required]
        public string Date { get; set; } = string.Empty;
        
        public string? Time { get; set; }
        public string? Pickup { get; set; }
        public string? Seat { get; set; }

        [Required]
        public string Ref { get; set; } = string.Empty;

        public string? Amount { get; set; }
        public decimal? PriceNum { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? Student { get; set; }
        public Vendor? Vendor { get; set; }
        public Trip? Trip { get; set; }
    }
}
