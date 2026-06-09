using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UniRide.Api.Data.Models
{
    public class Vendor
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid OwnerId { get; set; } // Reference to User.Id

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? RegistrationNumber { get; set; }
        
        [Required]
        public string ContactPerson { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }

        public string VerificationStatus { get; set; } = "pending"; // 'pending', 'approved', 'rejected'
        public string? RejectionReason { get; set; }

        public int TotalTrips { get; set; } = 0;
        public int TotalBookings { get; set; } = 0;
        public decimal TotalRevenue { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User Owner { get; set; } = null!;
        public ICollection<Trip> Trips { get; set; } = new List<Trip>();
    }
}
