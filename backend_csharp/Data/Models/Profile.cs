using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniRide.Api.Data.Models
{
    public class Profile
    {
        [Key]
        [ForeignKey("User")]
        public Guid Id { get; set; }

        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Matric { get; set; }
        public string? Department { get; set; }
        public string? StudentId { get; set; }
        
        [Required]
        public string Role { get; set; } = "student"; // 'student', 'vendor', 'admin'

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
