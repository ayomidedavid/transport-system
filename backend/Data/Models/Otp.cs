using System;
using System.ComponentModel.DataAnnotations;

namespace UniRide.Api.Data.Models
{
    public class Otp
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Code { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
