using System;
using System.ComponentModel.DataAnnotations;

namespace UniRide.Api.Data.Models
{
    public class Trip
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid VendorId { get; set; }

        [Required]
        public string Origin { get; set; } = string.Empty;

        [Required]
        public string Destination { get; set; } = string.Empty;

        public DateOnly DepartureDate { get; set; }
        public string DepartureTime { get; set; } = string.Empty;
        public string? ArrivalTime { get; set; }
        
        public string? VehicleType { get; set; }

        public int TotalSeats { get; set; }
        public int AvailableSeats { get; set; }

        public decimal Price { get; set; }

        public string Status { get; set; } = "active"; // active, completed, cancelled

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Vendor? Vendor { get; set; }
    }
}
