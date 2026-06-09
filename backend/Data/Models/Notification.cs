using System;
using System.ComponentModel.DataAnnotations;

namespace UniRide.Api.Data.Models
{
    public class Notification
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Type { get; set; } = string.Empty; // booking, payment, user, vendor, alert

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Body { get; set; } = string.Empty;

        public bool Read { get; set; } = false;

        [Required]
        public string RecipientRole { get; set; } = string.Empty; // admin, vendor, student

        public Guid? RecipientId { get; set; }

        public string? BookingRef { get; set; }
        public string? Agency { get; set; }
        public string? AgencyEmail { get; set; }
        public string? Route { get; set; }
        public string? Amount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? Recipient { get; set; }
    }
}
