using System;
using System.ComponentModel.DataAnnotations;

namespace UniRide.Api.Data.Models
{
    public class Transaction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid? BookingId { get; set; }
        public Guid? StudentId { get; set; }
        public Guid? VendorId { get; set; }

        [Required]
        public string Ref { get; set; } = string.Empty;

        public string? StudentName { get; set; }
        public string? VendorName { get; set; }
        public string? Route { get; set; }

        public decimal Amount { get; set; }

        [Required]
        public string Type { get; set; } = string.Empty; // booking, refund

        public string Status { get; set; } = "pending"; // successful, pending, failed

        public string? PaystackRef { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Booking? Booking { get; set; }
        public User? Student { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
